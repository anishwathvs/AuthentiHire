"""
AuthentiHire - Preprocessing Pipeline
====================================
Modular, reusable preprocessing and feature engineering routines for
detecting fraudulent job and internship postings.

Key Design Decisions:
1. Strict Leakage Prevention: Transformers (TF-IDF, encoders, scalers) are fit
   ONLY on training data and subsequently applied to test/validation splits.
2. Text Cleaning: Unescapes HTML entities, strips URLs/emails/HTML tags, removes
   noise characters, normalizes whitespace, and converts to lowercase.
3. Feature Fusion: Combines 5 core text fields (title, company_profile, description,
   requirements, benefits) while retaining metadata flags (e.g. has_company_logo,
   has_questions, telecommuting, salary presence).
4. Duplicate Removal: Removes duplicate job postings (excluding arbitrary job_id)
   to ensure zero cross-split data leakage.
"""

from typing import Dict, List, Optional, Tuple, Union
import re
import html
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split


TEXT_COLUMNS: List[str] = [
    "title",
    "company_profile",
    "description",
    "requirements",
    "benefits",
]

CATEGORICAL_COLUMNS: List[str] = [
    "employment_type",
    "required_experience",
    "required_education",
    "industry",
    "function",
]

METADATA_BINARY_COLUMNS: List[str] = [
    "telecommuting",
    "has_company_logo",
    "has_questions",
]


def clean_text(text: Optional[str]) -> str:
    """Cleans and normalizes a single raw text string.

    Steps:
    1. Handle NaN / non-string values -> returns empty string ''.
    2. Decode HTML entities (e.g., &amp; -> &, &#39; -> ').
    3. Remove web URLs and hyperlink patterns.
    4. Remove email addresses.
    5. Strip any residual HTML/XML tags.
    6. Remove non-alphanumeric characters (retaining word-level alphanumeric tokens).
    7. Normalize repeated whitespace.
    8. Convert to lowercase.
    """
    if not isinstance(text, str) or not text.strip():
        return ""

    # Decode HTML entities
    cleaned = html.unescape(text)

    # Remove URLs
    cleaned = re.sub(r"https?://\S+|www\.\S+", " ", cleaned)

    # Remove email addresses
    cleaned = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", " ", cleaned)

    # Remove HTML tags
    cleaned = re.sub(r"<.*?>", " ", cleaned)

    # Keep alphanumeric characters and whitespace
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", cleaned)

    # Normalize whitespace and convert to lowercase
    cleaned = re.sub(r"\s+", " ", cleaned).strip().lower()

    return cleaned


def build_combined_text(
    df: pd.DataFrame,
    text_cols: Optional[List[str]] = None,
) -> pd.Series:
    """Concatenates multiple text columns into a single unified text series.

    Each text field is cleaned individually before concatenation so that missing
    fields contribute cleanly as empty strings without inserting literal 'nan' words.
    """
    if text_cols is None:
        text_cols = TEXT_COLUMNS

    combined = pd.Series("", index=df.index, dtype=str)
    for col in text_cols:
        if col in df.columns:
            cleaned_col = df[col].fillna("").apply(clean_text)
            combined = combined + " " + cleaned_col

    return combined.str.strip()


def extract_location_features(df: pd.DataFrame) -> pd.DataFrame:
    """Parses location string (typically 'Country, State, City') into granular fields."""
    loc = df["location"].fillna("Missing") if "location" in df.columns else pd.Series("Missing", index=df.index)

    def parse_country(loc_val: str) -> str:
        if not isinstance(loc_val, str) or loc_val == "Missing" or not loc_val.strip():
            return "Missing"
        parts = [p.strip() for p in loc_val.split(",")]
        return parts[0] if parts and parts[0] else "Missing"

    def parse_state(loc_val: str) -> str:
        if not isinstance(loc_val, str) or loc_val == "Missing" or not loc_val.strip():
            return "Missing"
        parts = [p.strip() for p in loc_val.split(",")]
        return parts[1] if len(parts) > 1 and parts[1] else "Missing"

    country_series = loc.apply(parse_country)
    state_series = loc.apply(parse_state)

    return pd.DataFrame(
        {
            "country": country_series,
            "state_province": state_series,
        },
        index=df.index,
    )


def create_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Constructs structural, binary, and statistical metadata features from job postings."""
    feats = pd.DataFrame(index=df.index)

    # Binary presence indicators for sparse/optional fields
    feats["has_salary_range"] = (
        df["salary_range"].notnull().astype(int) if "salary_range" in df.columns else 0
    )
    feats["has_company_profile"] = (
        df["company_profile"].notnull().astype(int) if "company_profile" in df.columns else 0
    )
    feats["has_requirements"] = (
        df["requirements"].notnull().astype(int) if "requirements" in df.columns else 0
    )
    feats["has_benefits"] = (
        df["benefits"].notnull().astype(int) if "benefits" in df.columns else 0
    )

    # Core binary flags present in dataset
    for col in METADATA_BINARY_COLUMNS:
        if col in df.columns:
            feats[col] = df[col].fillna(0).astype(int)
        else:
            feats[col] = 0

    # Text length & count signals
    if "combined_text" in df.columns:
        feats["text_char_count"] = df["combined_text"].apply(len)
        feats["text_word_count"] = df["combined_text"].apply(lambda s: len(s.split()))
    elif "description" in df.columns:
        desc_clean = df["description"].fillna("").apply(clean_text)
        feats["text_char_count"] = desc_clean.apply(len)
        feats["text_word_count"] = desc_clean.apply(lambda s: len(s.split()))

    return feats


def clean_dataframe(
    df: pd.DataFrame,
    drop_duplicates: bool = True,
) -> pd.DataFrame:
    """Executes initial data cleaning, duplicate removal, and imputation on DataFrame."""
    data = df.copy()

    # Deduplicate based on all substantive columns (ignoring arbitrary job_id)
    if drop_duplicates:
        subset_cols = [c for c in data.columns if c != "job_id"]
        data = data.drop_duplicates(subset=subset_cols).reset_index(drop=True)

    # Drop job_id to eliminate data leakage and indexing bias
    if "job_id" in data.columns:
        data = data.drop(columns=["job_id"])

    # Create cleaned combined text representation
    data["combined_text"] = build_combined_text(data, TEXT_COLUMNS)

    # Extract location metadata
    loc_df = extract_location_features(data)
    data["country"] = loc_df["country"]
    data["state_province"] = loc_df["state_province"]

    # Fill missing categorical values with 'Missing'
    for col in CATEGORICAL_COLUMNS:
        if col in data.columns:
            data[col] = data[col].fillna("Missing")

    # Engineer metadata & binary indicators
    engineered_df = create_engineered_features(data)
    for col in engineered_df.columns:
        data[col] = engineered_df[col]

    return data


class JobPostingPreprocessor(BaseEstimator, TransformerMixin):
    """Scikit-Learn compatible preprocessor pipeline for AuthentiHire.

    Fits vectorizers strictly on the training partition to eliminate leakage.
    Provides vectorized sparse text representations alongside structured metadata.
    """

    def __init__(
        self,
        max_tfidf_features: int = 5000,
        ngram_range: Tuple[int, int] = (1, 2),
        min_df: int = 3,
        max_df: float = 0.95,
    ) -> None:
        self.max_tfidf_features = max_tfidf_features
        self.ngram_range = ngram_range
        self.min_df = min_df
        self.max_df = max_df
        self.tfidf_vectorizer: Optional[TfidfVectorizer] = None
        self.feature_names_: List[str] = []

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None) -> "JobPostingPreprocessor":
        """Fits the TF-IDF vectorizer strictly on training text data."""
        if "combined_text" not in X.columns:
            combined = build_combined_text(X, TEXT_COLUMNS)
        else:
            combined = X["combined_text"]

        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=self.max_tfidf_features,
            ngram_range=self.ngram_range,
            min_df=self.min_df,
            max_df=self.max_df,
            stop_words="english",
            sublinear_tf=True,
        )
        self.tfidf_vectorizer.fit(combined)
        self.feature_names_ = list(self.tfidf_vectorizer.get_feature_names_out())
        return self

    def transform(self, X: pd.DataFrame) -> Tuple[object, pd.DataFrame]:
        """Transforms text into TF-IDF sparse matrix and extracts aligned metadata features."""
        if self.tfidf_vectorizer is None:
            raise RuntimeError("Preprocessor must be fitted before calling transform().")

        if "combined_text" not in X.columns:
            combined = build_combined_text(X, TEXT_COLUMNS)
        else:
            combined = X["combined_text"]

        X_tfidf = self.tfidf_vectorizer.transform(combined)

        # Extract structured metadata features
        metadata_df = create_engineered_features(X)

        return X_tfidf, metadata_df

    def fit_transform(
        self, X: pd.DataFrame, y: Optional[pd.Series] = None
    ) -> Tuple[object, pd.DataFrame]:
        return self.fit(X, y).transform(X)


def prepare_train_test_splits(
    csv_path: str,
    test_size: float = 0.2,
    random_state: int = 42,
    drop_duplicates: bool = True,
) -> Dict[str, Union[pd.DataFrame, pd.Series, JobPostingPreprocessor]]:
    """Loads raw dataset, cleans, and generates stratified train and test splits.

    Guarantees:
    - Stratified splitting preserving class ratio across train/test splits.
    - Zero data leakage: preprocessor is fit solely on the training split.
    """
    raw_df = pd.read_csv(csv_path)
    cleaned_df = clean_dataframe(raw_df, drop_duplicates=drop_duplicates)

    if "fraudulent" not in cleaned_df.columns:
        raise KeyError("Target column 'fraudulent' not found in dataset.")

    X = cleaned_df.drop(columns=["fraudulent"])
    y = cleaned_df["fraudulent"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )

    preprocessor = JobPostingPreprocessor()
    preprocessor.fit(X_train, y_train)

    return {
        "X_train": X_train.reset_index(drop=True),
        "X_test": X_test.reset_index(drop=True),
        "y_train": y_train.reset_index(drop=True),
        "y_test": y_test.reset_index(drop=True),
        "cleaned_full_df": cleaned_df,
        "preprocessor": preprocessor,
    }


if __name__ == "__main__":
    import os

    data_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data",
        "fake_job_postings.csv",
    )
    if os.path.exists(data_path):
        splits = prepare_train_test_splits(data_path)
        print("Preprocessing Pipeline Validation Successful:")
        print(f"  Train set: {splits['X_train'].shape}, Class distribution: {dict(splits['y_train'].value_counts())}")
        print(f"  Test set:  {splits['X_test'].shape}, Class distribution: {dict(splits['y_test'].value_counts())}")
        print(f"  Vocabulary size: {len(splits['preprocessor'].feature_names_)}")
    else:
        print(f"Dataset not found at {data_path}")
