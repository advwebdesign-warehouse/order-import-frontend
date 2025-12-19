//file path: app/dashboard/shared/utils/usCities.ts

/**
 * Major cities by US state
 * Used for city selection dropdowns
 */

export const US_CITIES: Record<string, string[]> = {
  'AL': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'],
  'AK': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan'],
  'AZ': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Tempe'],
  'AR': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro'],
  'CA': ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim', 'Santa Ana', 'Riverside', 'Stockton', 'Irvine', 'Chula Vista'],
  'CO': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton', 'Arvada'],
  'CT': ['Bridgeport', 'New Haven', 'Stamford', 'Hartford', 'Waterbury', 'Norwalk'],
  'DE': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna'],
  'FL': ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral'],
  'GA': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens', 'Sandy Springs', 'Macon'],
  'HI': ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu', 'Kaneohe'],
  'ID': ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello', 'Caldwell'],
  'IL': ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield', 'Peoria'],
  'IN': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers'],
  'IA': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City'],
  'KS': ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe', 'Lawrence'],
  'KY': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'],
  'LA': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'],
  'ME': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn'],
  'MD': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie', 'Hagerstown'],
  'MA': ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton'],
  'MI': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing'],
  'MN': ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington'],
  'MS': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi'],
  'MO': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence'],
  'MT': ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte'],
  'NE': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney'],
  'NV': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks'],
  'NH': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester'],
  'NJ': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge', 'Lakewood'],
  'NM': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell'],
  'NY': ['New York', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle'],
  'NC': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville'],
  'ND': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo'],
  'OH': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
  'OK': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton'],
  'OR': ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Beaverton'],
  'PA': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton'],
  'RI': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence'],
  'SC': ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill'],
  'SD': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown'],
  'TN': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro'],
  'TX': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Laredo'],
  'UT': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy'],
  'VT': ['Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier'],
  'VA': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Hampton'],
  'WA': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett'],
  'WV': ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling'],
  'WI': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton'],
  'WY': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs']
}

/**
 * Get cities for a state
 */
export function getCitiesByState(stateCode: string): string[] {
  return US_CITIES[stateCode] || []
}

/**
 * Check if a city exists in a state
 */
export function isCityInState(city: string, stateCode: string): boolean {
  const cities = getCitiesByState(stateCode)
  return cities.some(c => c.toLowerCase() === city.toLowerCase())
}
