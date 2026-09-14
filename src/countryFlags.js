// Misma logica que public/js/countryFlags.js (version de navegador, sin
// modulos) para poder generar la bandera tambien en el HTML renderizado en
// servidor de la ficha de jugador. Al no haber empaquetador de JS esta
// duplicada; si se cambia una hay que cambiar la otra.
const COUNTRY_TO_ISO2 = {
  USA: 'US', Canada: 'CA', Mexico: 'MX', 'Dominican Republic': 'DO',
  'Puerto Rico': 'PR', Bahamas: 'BS', Jamaica: 'JM', Panama: 'PA', Cuba: 'CU',
  'Virgin Islands': 'VI',

  Brazil: 'BR', Argentina: 'AR', Venezuela: 'VE', Colombia: 'CO',
  Uruguay: 'UY', Chile: 'CL', Peru: 'PE',

  France: 'FR', Spain: 'ES', Germany: 'DE', Italy: 'IT',
  England: 'GB', 'United Kingdom': 'GB', Scotland: 'GB',
  Serbia: 'RS', Croatia: 'HR', Slovenia: 'SI', Lithuania: 'LT',
  Latvia: 'LV', Estonia: 'EE', Greece: 'GR', Turkey: 'TR',
  Montenegro: 'ME', 'Bosnia and Herzegovina': 'BA', Poland: 'PL',
  'Czech Republic': 'CZ', Czechia: 'CZ', Ukraine: 'UA', Russia: 'RU',
  Georgia: 'GE', Switzerland: 'CH', Belgium: 'BE', Netherlands: 'NL',
  Austria: 'AT', Finland: 'FI', Sweden: 'SE', Norway: 'NO', Denmark: 'DK',
  Portugal: 'PT', Hungary: 'HU', Israel: 'IL', 'North Macedonia': 'MK',
  Slovakia: 'SK', Romania: 'RO', Bulgaria: 'BG', Ireland: 'IE',

  Nigeria: 'NG', Cameroon: 'CM', Senegal: 'SN', Mali: 'ML', Sudan: 'SD',
  'South Sudan': 'SS', Egypt: 'EG',
  'Democratic Republic of the Congo': 'CD', Congo: 'CG', Angola: 'AO',
  Guinea: 'GN', 'Ivory Coast': 'CI', "Cote d'Ivoire": 'CI', Tunisia: 'TN',
  'South Africa': 'ZA', Ghana: 'GH', Kenya: 'KE', Gabon: 'GA',

  China: 'CN', Japan: 'JP', Philippines: 'PH', Australia: 'AU',
  'New Zealand': 'NZ', 'South Korea': 'KR'
};

function flagEmojiFromIso2(code) {
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
}

function countryFlag(country) {
  if (!country) return '';
  const code = COUNTRY_TO_ISO2[country.trim()];
  return code ? flagEmojiFromIso2(code) : '';
}

module.exports = { countryFlag };
