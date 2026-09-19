/* ============================================================================
   99WORLDCUP — POLICIES
   Placeholders in [BRACKETS] are deliberate. Nothing here invents a company,
   an address or a jurisdiction, and every document says plainly that it needs
   a lawyer before launch.
   ========================================================================== */
import { el } from '../core/dom.js';
import { S, fmtDate } from '../config/season.js';

/* -------------------------------- LEGAL ----------------------------------- */
export function LegalNav(current) {
  const items = [['rules', 'RULES'], ['terms', 'TERMS & CONDITIONS'],
                 ['privacy', 'PRIVACY POLICY'], ['cookies', 'COOKIE POLICY'],
                 ['contact', 'CONTACT']];
  return el('nav', { 'aria-label': 'Policies' }, items.map(([k, label]) =>
    el('a', { href: '#/' + k, text: label, 'aria-current': k === current ? 'page' : null })));
}

export const PLACEHOLDER = '[OPERATING ENTITY — TO BE COMPLETED]';
export const PLACEHOLDER_MAIL = '[CONTACT ADDRESS — TO BE COMPLETED]';

export function LegalPage(key, title, blocks, note) {
  return el('div', { class: 'legal shell' }, [
    LegalNav(key),
    el('article', { class: 'panel doc' }, [
      el('h1', { class: 'coin', text: title }),
      el('p', { class: 'muted', text: 'Last updated ' + fmtDate(Date.parse(S.start)) + '.' }),
      note ? el('div', { class: 'flagnote' }, [el('p', { style: 'margin:0', text: note })]) : null,
      ...blocks.map(([h, ...ps]) => el('section', {}, [
        el('h3', { text: h }),
        ...ps.map(p => Array.isArray(p)
          ? el('ul', {}, p.map(li => el('li', { text: li })))
          : el('p', { text: p }))
      ]))
    ])
  ]);
}

export function ViewTerms() {
  return LegalPage('terms', 'TERMS & CONDITIONS', [
    ['1. Eligibility',
      'You must be at least 13 years old to create a player identity and take part in 99WorldCup. ' +
      'Where local law sets a higher minimum age for using an online service without parental ' +
      'consent, that higher age applies to you.'],
    ['2. Your player identity',
      'You are responsible for your display name and for activity carried out under your identity. ' +
      'Names that impersonate staff, moderators or other players may be changed or removed.'],
    ['3. Fair play',
      'Scores must come from actually playing the game in this browser. The following are not allowed:',
      ['Modifying game code, memory, timers or network requests to influence a score',
       'Submitting a score that was not produced by a real, completed run',
       'Automating play with scripts, macros or bots',
       'Using additional accounts to manipulate a leaderboard position',
       'Interfering with the service, its APIs or other players'],
      'Scores that fail validation are withheld from leaderboards and marked under review or rejected. Where ' +
      'there is strong evidence of deliberate manipulation, scores may be removed and an identity ' +
      'suspended. A single unusual score is treated as something to look at, not as proof.'],
    ['4. Seasons, leaderboards and badges',
      'A season runs for exactly 99 days. At the end of day 99 all leaderboards for that season ' +
      'freeze and become historical records. Badges awarded at freeze reflect final placement and ' +
      'are not recalculated afterwards. We may correct a historical record only to remove a score ' +
      'shown to be fraudulent, or where we are legally required to.'],
    ['5. Content and conduct',
      'Do not submit names or other text that is unlawful, hateful, harassing, sexual, or that ' +
      'impersonates another person. We may remove such content and the identity behind it.'],
    ['6. Intellectual property',
      'The 99WorldCup name, artwork, interface and game implementations are owned by ' + PLACEHOLDER +
      '. The games in Season 01 are original implementations inspired by classic arcade genres; ' +
      'they are not affiliated with, endorsed by, or licensed from the rights holders of any ' +
      'classic arcade title.'],
    ['7. Availability',
      'This is a free service provided as-is. It may be unavailable, interrupted or changed. ' +
      'Competitive play requires a working connection; there is no offline competitive mode.'],
    ['8. Payments',
      'There is no payment system in 99WorldCup and nothing here is sold. Because nothing is ' +
      'charged, there is nothing to refund. If paid features are ever introduced, refund terms ' +
      'will be added to this section before anything is offered for sale.'],
    ['9. Termination',
      'You may stop playing and request deletion of your player record at any time via the contact ' +
      'route on the Contact page. We may suspend an identity that breaks these terms.'],
    ['10. Liability and governing law',
      'To the extent permitted by law, ' + PLACEHOLDER + ' is not liable for indirect or ' +
      'consequential loss arising from use of this service. Governing law and jurisdiction: ' +
      '[JURISDICTION — TO BE COMPLETED]. Contact: ' + PLACEHOLDER_MAIL + '.']
  ],
  'These terms are a working draft written for a product that does not yet have a named operating ' +
  'entity or jurisdiction. Every bracketed placeholder must be filled in, and the whole document ' +
  'reviewed by a qualified lawyer, before launch. This is not legal advice.');
}

export function ViewPrivacy() {
  return LegalPage('privacy', 'PRIVACY POLICY', [
    ['What we collect',
      '99WorldCup is built to need as little as possible about you:',
      ['A display name, which you choose and which is public',
       'A country, which you choose from a list and which is public',
       'Your scores, run counts and season participation',
       'A player identifier used to attach your scores to your identity']],
    ['How country is determined',
      'We do not look up your location. The country selector is pre-filled from your browser time ' +
      'zone as a guess, and nothing is stored until you confirm or change it. Country is held at ' +
      'country level only — never a city, an address or GPS coordinates. Time zones do not map ' +
      'cleanly onto countries, so the guess is often wrong and you are expected to correct it.'],
    ['IP addresses',
      'We do not store raw IP addresses as part of your player record. Where a hosting provider ' +
      'logs request metadata for abuse prevention, that data belongs to the provider and should ' +
      'be kept for the shortest period that serves that purpose. ' + PLACEHOLDER + ' must confirm ' +
      'the exact retention period with its provider and state it here before launch.'],
    ['Local storage',
      'Your name, country and personal bests are also kept in this browser so the game works when ' +
      'the scoreboard is unreachable. Clearing your browser data removes that copy.'],
    ['Why we keep scores',
      'Frozen season results are the point of 99WorldCup: an S01 placement has to still be true in ' +
      'S09. Historical scores and badges are therefore retained indefinitely unless a record must ' +
      'be removed for fraud or for legal reasons. If you ask us to delete your identity, your ' +
      'display name can be removed from historical boards while the anonymised placement remains.'],
    ['Analytics and third parties',
      'No advertising, no cross-site tracking, no third-party analytics are used in this build. ' +
      'If product analytics are added later, they must be privacy-preserving and listed here ' +
      'before they are switched on.'],
    ['Your rights',
      'Depending on where you live you may have the right to access, correct, export or delete your ' +
      'personal data, and to object to certain processing. Requests go to ' + PLACEHOLDER_MAIL + '.'],
    ['Children',
      '99WorldCup is not intended for anyone under 13. If you believe a child under 13 has created ' +
      'an identity, contact us and it will be removed.']
  ],
  'Placeholders for the operating entity, contact address and provider retention periods must be ' +
  'completed, and this document reviewed against the privacy law of each market, before launch.');
}

export function ViewCookies() {
  return LegalPage('cookies', 'COOKIE POLICY', [
    ['The short version',
      '99WorldCup does not set advertising or tracking cookies and does not share anything with ' +
      'ad networks.'],
    ['What is actually stored',
      ['Sign-in state, handled by the platform hosting this page, so your scores attach to you',
       'A single local storage entry holding your chosen name, country and personal bests']],
    ['What is not stored',
      ['Advertising or profiling identifiers', 'Cross-site trackers or pixels',
       'Third-party analytics cookies', 'Fingerprinting of any kind']],
    ['Managing it',
      'You can clear the local entry by clearing site data in your browser. Doing so loses your ' +
      'local personal bests but not scores already recorded on the scoreboard. Blocking essential ' +
      'storage will stop score submission from working.'],
    ['Changes',
      'If a cookie or similar technology is ever added, this page is updated before it is used, ' +
      'and consent is collected where the law requires it.']
  ],
  'Cookie and consent obligations vary by market. Confirm with a qualified lawyer whether a ' +
  'consent banner is required in your launch regions before going live.');
}

export function ViewContact() {
  return el('div', { class: 'legal shell' }, [
    LegalNav('contact'),
    el('article', { class: 'panel doc' }, [
      el('h1', { class: 'coin', text: 'CONTACT' }),
      el('div', { class: 'flagnote' }, [el('p', { style: 'margin:0',
        text: 'No contact channel has been set up yet. Rather than print an address that does not ' +
              'receive mail, this page names what has to exist before launch.' })]),
      el('h3', { text: 'Required before launch' }),
      el('ul', {}, [
        el('li', { text: 'A monitored address for score disputes and moderation appeals' }),
        el('li', { text: 'A monitored address for privacy requests (access, deletion, export)' }),
        el('li', { text: 'A named operating entity and jurisdiction for the legal pages' }),
        el('li', { text: 'A security contact for vulnerability reports' })
      ]),
      el('p', { class: 'muted', text: 'Until those exist, ' + PLACEHOLDER_MAIL +
        ' appears in the policies as a placeholder and is not a working address.' })
    ])
  ]);
}
