import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
import 'dotenv/config';

const COMPREHENSIVE_NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Antiguan', 'Argentine', 'Armenian',
  'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi', 'Barbadian', 'Belarusian',
  'Belgian', 'Belizean', 'Beninese', 'Bhutanese', 'Bolivian', 'Bosnian', 'Brazilian', 'British', 'Bruneian',
  'Bulgarian', 'Burkinabe', 'Burmese', 'Burundian', 'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean',
  'Central African', 'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comoran', 'Congolese', 'Costa Rican',
  'Croatian', 'Cuban', 'Cypriot', 'Czech', 'Danish', 'Djiboutian', 'Dominican', 'Dutch', 'East Timorese',
  'Ecuadorean', 'Egyptian', 'Emirian', 'Equatorial Guinean', 'Eritrean', 'Estonian', 'Ethiopian', 'Fijian',
  'Filipino', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian', 'Greek',
  'Grenadian', 'Guatemalan', 'Guinean', 'Guyanese', 'Haitian', 'Honduran', 'Hungarian', 'Icelandic',
  'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican',
  'Japanese', 'Jordanian', 'Kazakhstani', 'Kenyan', 'Kuwaiti', 'Kyrgyz', 'Laotian', 'Latvian', 'Lebanese',
  'Liberian', 'Libyan', 'Liechtensteiner', 'Lithuanian', 'Luxembourger', 'Macedonian', 'Malagasy', 'Malawian',
  'Malaysian', 'Maldivian', 'Malian', 'Maltese', 'Marshallese', 'Mauritanian', 'Mauritian', 'Mexican',
  'Micronesian', 'Moldovan', 'Monacan', 'Mongolian', 'Montenegrin', 'Moroccan', 'Mozambican', 'Namibian',
  'Nauruan', 'Nepalese', 'New Zealander', 'Nicaraguan', 'Nigerian', 'Nigerien', 'North Korean', 'Norwegian',
  'Omani', 'Pakistani', 'Palauan', 'Palestinian', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian',
  'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan', 'Saint Lucian', 'Salvadoran', 'Samoan',
  'San Marinese', 'Sao Tomean', 'Saudi', 'Senegalese', 'Serbian', 'Seychellois', 'Sierra Leonean', 'Singaporean',
  'Slovak', 'Slovenian', 'Solomon Islander', 'Somali', 'South African', 'South Korean', 'South Sudanese',
  'Spanish', 'Sri Lankan', 'Sudanese', 'Surinamer', 'Swazi', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese',
  'Tajik', 'Tanzanian', 'Thai', 'Togolese', 'Tongan', 'Trinidadian', 'Tunisian', 'Turkish', 'Turkmen',
  'Tuvaluan', 'Ugandan', 'Ukrainian', 'Uruguayan', 'Uzbekistani', 'Venezuelan', 'Vietnamese', 'Yemeni',
  'Zambian', 'Zimbabwean'
];

async function seedNationalities() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });

  try {
    console.log('Starting nationality seeding...');
    
    // Get the owner user (from OWNER_OPEN_ID env variable)
    const ownerOpenId = process.env.OWNER_OPEN_ID;
    if (!ownerOpenId) {
      console.log('OWNER_OPEN_ID not found. Skipping nationality seeding.');
      return;
    }

    const owner = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.openId, ownerOpenId))
      .limit(1);
    
    if (owner.length === 0) {
      console.log('Owner user not found. Skipping nationality seeding.');
      return;
    }

    const userId = owner[0].id;
    console.log(`Seeding nationalities for owner user ${userId}...`);
    
    // Batch insert all nationalities that don't exist
    const existingNationalities = await db
      .select({ nationality: schema.nationalities.nationality })
      .from(schema.nationalities)
      .where(eq(schema.nationalities.userId, userId));
    
    const existingSet = new Set(existingNationalities.map(n => n.nationality));
    const toInsert = COMPREHENSIVE_NATIONALITIES.filter(n => !existingSet.has(n));
    
    if (toInsert.length > 0) {
      const values = toInsert.map(nationality => ({
        userId: userId,
        nationality: nationality,
      }));
      
      await db.insert(schema.nationalities).values(values);
      console.log(`✓ Seeded ${toInsert.length} new nationalities for owner user ${userId}`);
    } else {
      console.log(`✓ All nationalities already exist for owner user ${userId}`);
    }

    console.log('✓ Nationality seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding nationalities:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedNationalities().catch(console.error);
