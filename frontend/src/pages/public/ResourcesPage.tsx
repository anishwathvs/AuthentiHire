import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  ShieldCheck,
  Mail,
  Lock,
  DollarSign,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { AnimatedSection } from '../../components/ui/AnimatedSection';

interface ResourceItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  icon: React.ReactNode;
  content: string[];
}

export const ResourcesPage: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>('upfront-fees');

  const resources: ResourceItem[] = [
    {
      id: 'upfront-fees',
      category: 'Financial Red Flags',
      title: 'Why legitimate employers NEVER demand upfront payments or cashier checks',
      summary: 'Understanding the counterfeit cashier check and home-office equipment scam.',
      icon: <DollarSign size={20} color="#F04438" />,
      content: [
        'Scammers send a counterfeit digital check (or real-looking paper check) for $2,000–$5,000, instructing the candidate to deposit it and immediately wire money to a "designated equipment vendor".',
        'By US federal banking regulations, banks make funds available in 1–2 business days before the check is formally settled. Weeks later, when the counterfeit check bounces, the victim is personally liable for the full withdrawn sum.',
        'Legitimate employers ship pre-configured laptops or reimburse authorized expenses directly through corporate expense management systems (e.g., Expensify, Concur).',
      ],
    },
    {
      id: 'chat-interviews',
      category: 'Communication Red Flags',
      title: 'Unofficial messaging apps: Telegram, WhatsApp, and Signal interview scams',
      summary: 'Why text-only interviews on non-corporate chat platforms are primary scam indicators.',
      icon: <MessageSquare size={20} color="#F79009" />,
      content: [
        'Scammers avoid live video calls (Zoom, Google Meet, Microsoft Teams) or official corporate email threads to conceal their identity and geographic location.',
        'Text interviews via Telegram, WhatsApp, or Google Chat are typically scripted bots or social engineering operators designed to extract your SSN, banking info, or direct deposits.',
        'Always insist on verified corporate email invites and live interactive video calls with verified team members.',
      ],
    },
    {
      id: 'domain-matching',
      category: 'Infrastructure & Identity',
      title: 'Verifying recruiter email domains vs. company domains',
      summary: 'Spotting lookalike domains and free webmail addresses.',
      icon: <Mail size={20} color="#1677FF" />,
      content: [
        'Lookalike / Typo-squatting domains: Fraudsters register domains resembling legitimate brands (e.g., @stripe-careers.com or @google-hiring.net instead of @stripe.com or @google.com).',
        'Free webmail providers: Major tech companies and enterprise employers never recruit candidates using @gmail.com, @yahoo.com, or @outlook.com addresses.',
        'Always check the company’s official corporate career portal directly (e.g., company.com/careers) to verify that the job opening actually exists.',
      ],
    },
    {
      id: 'https-myths',
      category: 'Technical Myths',
      title: 'Why HTTPS (the padlock icon) does NOT mean a company is legitimate',
      summary: 'Understanding that SSL encryption only proves connection security, not corporate trustworthiness.',
      icon: <Lock size={20} color="#475467" />,
      content: [
        'A browser padlock / HTTPS only signifies that the traffic between your browser and the web server is encrypted against eavesdropping.',
        'Today, anyone (including fraudsters) can obtain automated, free SSL certificates in seconds from Let\'s Encrypt or Cloudflare.',
        'Do not mistake an HTTPS padlock for verified corporate legitimacy. Look for domain registration age, MX mail records, and independent business registrations.',
      ],
    },
    {
      id: 'missing-presence',
      category: 'Nuanced Evaluation',
      title: 'Why a missing online presence does not automatically mean fraud',
      summary: 'Distinguishing early-stage startups from deceptive fraudulent entities.',
      icon: <HelpCircle size={20} color="#12B76A" />,
      content: [
        'Early-stage stealth startups or boutique local businesses may have minimal web presence, unranked domains, or recent registrations.',
        'AuthentiHire marks missing signals neutrally as UNAVAILABLE rather than falsely labeling them as fraud.',
        'If a company has a new domain, look for verified founders on LinkedIn, state business registry filings, or mutual professional connections.',
      ],
    },
  ];

  return (
    <div style={{ backgroundColor: '#FFFFFF', paddingBottom: '6rem' }}>
      {/* Header */}
      <section style={{ padding: '5rem 1.5rem 4rem', backgroundColor: '#F8FAFC', borderBottom: '1px solid #EAECF0' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#F0F7FF',
              color: '#1677FF',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            Safety Knowledge Center
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
              fontWeight: 800,
              color: '#0B1F3A',
              letterSpacing: '-0.035em',
              marginBottom: '1.25rem',
            }}
          >
            Job Scam Indicators & Safety Guide
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#475467', lineHeight: 1.6 }}>
            Comprehensive, factual guidance on identifying recruitment fraud, verifying corporate identities, and protecting your confidential data.
          </p>
        </div>
      </section>

      {/* Accordion List */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '4rem 1.5rem 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {resources.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <AnimatedSection
                key={item.id}
                style={{
                  borderRadius: '12px',
                  border: isExpanded ? '1px solid #BAE0FF' : '1px solid #EAECF0',
                  backgroundColor: isExpanded ? '#FFFFFF' : '#F8FAFC',
                  boxShadow: isExpanded ? '0 4px 12px rgba(22, 119, 255, 0.08)' : 'none',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{
                    width: '100%',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: isExpanded ? '#EFF8FF' : '#FFFFFF',
                        border: '1px solid #EAECF0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        {item.category}
                      </div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0B1F3A', margin: 0, lineHeight: 1.4 }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#667085', marginTop: '0.375rem', margin: 0 }}>
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div style={{ color: '#94A3B8', marginTop: '4px', flexShrink: 0 }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isExpanded && (
                  <div
                    style={{
                      padding: '0 1.5rem 1.5rem 4.75rem',
                      borderTop: '1px solid #F2F4F7',
                      paddingTop: '1.25rem',
                    }}
                  >
                    <ul style={{ listStyle: 'disc', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6 }}>
                      {item.content.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AnimatedSection>
            );
          })}
        </div>

        {/* Action Link to Workspace */}
        <div style={{ textAlign: 'center', marginTop: '4rem', paddingTop: '2.5rem', borderTop: '1px solid #EAECF0' }}>
          <p style={{ fontSize: '1rem', color: '#475467', marginBottom: '1.25rem' }}>
            Have a suspicious job posting you want to inspect right now?
          </p>
          <Link
            to="/app/analyze"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              backgroundColor: '#1677FF',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.9375rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(22, 119, 255, 0.25)',
            }}
          >
            <span>Launch Analysis Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
