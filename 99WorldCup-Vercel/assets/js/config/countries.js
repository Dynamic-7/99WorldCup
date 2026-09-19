/* ============================================================================
   99WORLDCUP — COUNTRIES
   Country is shown at country level only. There is no geolocation lookup
   anywhere in this project; the time-zone map below only PRE-FILLS a selector
   that the player confirms. See the Privacy Policy.
   ========================================================================== */

export const COUNTRIES = [
  ['IN','India','🇮🇳'],['US','United States','🇺🇸'],['JP','Japan','🇯🇵'],['GB','United Kingdom','🇬🇧'],
  ['DE','Germany','🇩🇪'],['BR','Brazil','🇧🇷'],['KR','South Korea','🇰🇷'],['CA','Canada','🇨🇦'],
  ['AU','Australia','🇦🇺'],['FR','France','🇫🇷'],['IT','Italy','🇮🇹'],['ES','Spain','🇪🇸'],
  ['MX','Mexico','🇲🇽'],['NL','Netherlands','🇳🇱'],['SE','Sweden','🇸🇪'],['NO','Norway','🇳🇴'],
  ['PL','Poland','🇵🇱'],['TR','Turkey','🇹🇷'],['ID','Indonesia','🇮🇩'],['PH','Philippines','🇵🇭'],
  ['VN','Vietnam','🇻🇳'],['TH','Thailand','🇹🇭'],['SG','Singapore','🇸🇬'],['MY','Malaysia','🇲🇾'],
  ['PK','Pakistan','🇵🇰'],['BD','Bangladesh','🇧🇩'],['LK','Sri Lanka','🇱🇰'],['NP','Nepal','🇳🇵'],
  ['AE','United Arab Emirates','🇦🇪'],['SA','Saudi Arabia','🇸🇦'],['EG','Egypt','🇪🇬'],
  ['NG','Nigeria','🇳🇬'],['KE','Kenya','🇰🇪'],['ZA','South Africa','🇿🇦'],['GH','Ghana','🇬🇭'],
  ['AR','Argentina','🇦🇷'],['CL','Chile','🇨🇱'],['CO','Colombia','🇨🇴'],['PE','Peru','🇵🇪'],
  ['PT','Portugal','🇵🇹'],['IE','Ireland','🇮🇪'],['BE','Belgium','🇧🇪'],['CH','Switzerland','🇨🇭'],
  ['AT','Austria','🇦🇹'],['DK','Denmark','🇩🇰'],['FI','Finland','🇫🇮'],['CZ','Czechia','🇨🇿'],
  ['GR','Greece','🇬🇷'],['RO','Romania','🇷🇴'],['UA','Ukraine','🇺🇦'],['IL','Israel','🇮🇱'],
  ['NZ','New Zealand','🇳🇿'],['TW','Taiwan','🇹🇼'],['HK','Hong Kong','🇭🇰'],['CN','China','🇨🇳'],
  ['RU','Russia','🇷🇺'],['XX','Not saying','🏳️']
];

export const CMAP = Object.fromEntries(COUNTRIES.map(c => [c[0], c]));

/* timezone → country is a *guess* we offer as a default. It is never
   silently stored: the player confirms it. See Privacy Policy. */
export const TZ_HINT = {
  'Asia/Kolkata':'IN','Asia/Calcutta':'IN','Asia/Tokyo':'JP','Asia/Seoul':'KR','Asia/Shanghai':'CN',
  'Asia/Singapore':'SG','Asia/Jakarta':'ID','Asia/Manila':'PH','Asia/Bangkok':'TH','Asia/Karachi':'PK',
  'Asia/Dhaka':'BD','Asia/Colombo':'LK','Asia/Kathmandu':'NP','Asia/Dubai':'AE','Asia/Riyadh':'SA',
  'Asia/Ho_Chi_Minh':'VN','Asia/Kuala_Lumpur':'MY','Asia/Taipei':'TW','Asia/Hong_Kong':'HK',
  'Asia/Jerusalem':'IL','Europe/London':'GB','Europe/Dublin':'IE','Europe/Paris':'FR','Europe/Berlin':'DE',
  'Europe/Madrid':'ES','Europe/Rome':'IT','Europe/Amsterdam':'NL','Europe/Stockholm':'SE',
  'Europe/Oslo':'NO','Europe/Warsaw':'PL','Europe/Istanbul':'TR','Europe/Lisbon':'PT',
  'Europe/Brussels':'BE','Europe/Zurich':'CH','Europe/Vienna':'AT','Europe/Copenhagen':'DK',
  'Europe/Helsinki':'FI','Europe/Prague':'CZ','Europe/Athens':'GR','Europe/Bucharest':'RO',
  'Europe/Kyiv':'UA','Europe/Moscow':'RU','America/New_York':'US','America/Chicago':'US',
  'America/Denver':'US','America/Los_Angeles':'US','America/Toronto':'CA','America/Vancouver':'CA',
  'America/Mexico_City':'MX','America/Sao_Paulo':'BR','America/Argentina/Buenos_Aires':'AR',
  'America/Santiago':'CL','America/Bogota':'CO','America/Lima':'PE','Africa/Lagos':'NG',
  'Africa/Nairobi':'KE','Africa/Johannesburg':'ZA','Africa/Cairo':'EG','Africa/Accra':'GH',
  'Australia/Sydney':'AU','Australia/Melbourne':'AU','Pacific/Auckland':'NZ'
};
