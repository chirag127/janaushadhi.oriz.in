#!/usr/bin/env node

/**
 * CSV → JSON Processor for Janaushadhi Medicine Data
 *
 * Reads data.csv and generates:
 * - src/data/medicines.json (all medicines with slugs, search-optimized)
 * - src/data/categories.json (category list with counts)
 *
 * Usage: pnpm process-csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const csvPath = path.join(rootDir, 'data.csv');
const outputDir = path.join(rootDir, 'src', 'data');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Generate URL-safe slug from string
 */
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/--+/g, '-')           // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Parse CSV line (handles quoted fields)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

/**
 * Main processor
 */
function processCSV() {
  console.log('📊 Processing medicine data CSV...');

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    console.error('❌ CSV file is empty!');
    process.exit(1);
  }

  // Parse header
  const headers = parseCSVLine(lines[0].trim());
  console.log(`   Headers: ${headers.join(', ')}`);

  // Validate expected columns
  const expectedHeaders = ['Sr No', 'Drug Code', 'Generic Name', 'Unit Size', 'MRP', 'Group Name'];
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    console.error(`❌ Missing required columns: ${missingHeaders.join(', ')}`);
    process.exit(1);
  }

  // Get column indices
  const srNoIdx = headers.indexOf('Sr No');
  const drugCodeIdx = headers.indexOf('Drug Code');
  const genericNameIdx = headers.indexOf('Generic Name');
  const unitSizeIdx = headers.indexOf('Unit Size');
  const mrpIdx = headers.indexOf('MRP');
  const groupNameIdx = headers.indexOf('Group Name');

  const medicines = [];
  const categoriesMap = new Map();

  let processed = 0;
  let errors = 0;

  // Process data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);

      const srNo = values[srNoIdx]?.trim() || '';
      const drugCode = values[drugCodeIdx]?.trim() || '';
      const genericName = values[genericNameIdx]?.trim() || '';
      const unitSize = values[unitSizeIdx]?.trim() || '';
      const mrpRaw = values[mrpIdx]?.trim() || '0';
      const groupName = values[groupNameIdx]?.trim() || '';

      // Validate required fields
      if (!drugCode || !genericName) {
        console.warn(`   ⚠️  Row ${i + 1}: Missing drug code or generic name, skipping`);
        errors++;
        continue;
      }

      // Parse MRP
      const mrp = parseFloat(mrpRaw) || 0;

      // Generate slug (unique per drug code + name)
      const slug = generateSlug(`${drugCode}-${genericName}`);

      // Build medicine object
      const medicine = {
        id: parseInt(srNo) || i,
        drugCode: drugCode,
        genericName: genericName,
        unitSize: unitSize,
        mrp: mrp,
        groupName: groupName,
        slug: slug,
        // Computed fields
        isPriceOnRequest: mrp === 0,
        priceDisplay: mrp === 0 ? 'Price on Request' : `₹${mrp.toFixed(2)}`,
      };

      medicines.push(medicine);

      // Track category counts
      if (groupName) {
        categoriesMap.set(groupName, (categoriesMap.get(groupName) || 0) + 1);
      }

      processed++;

    } catch (error) {
      console.error(`   ❌ Error processing row ${i + 1}:`, error.message);
      errors++;
    }
  }

  console.log(`✅ Processed ${processed} medicines (${errors} errors)`);

  // Sort medicines by drug code numerically
  medicines.sort((a, b) => parseInt(a.drugCode) - parseInt(b.drugCode));

  // Build categories array
  const categories = Array.from(categoriesMap.entries())
    .map(([name, count]) => ({
      name: name,
      slug: generateSlug(name),
      count: count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`✅ Found ${categories.length} categories`);

  // Write medicines.json (pretty-printed for readability)
  fs.writeFileSync(
    path.join(outputDir, 'medicines.json'),
    JSON.stringify(medicines, null, 2) + '\n',
    'utf-8'
  );
  console.log(`   ✓ Written src/data/medicines.json (${medicines.length} records)`);

  // Write categories.json
  fs.writeFileSync(
    path.join(outputDir, 'categories.json'),
    JSON.stringify(categories, null, 2) + '\n',
    'utf-8'
  );
  console.log(`   ✓ Written src/data/categories.json (${categories.length} categories)`);

  // Generate summary statistics
  const pricedItems = medicines.filter(m => !m.isPriceOnRequest);
  const priceOnRequest = medicines.filter(m => m.isPriceOnRequest);

  const minPrice = Math.min(...pricedItems.map(m => m.mrp));
  const maxPrice = Math.max(...pricedItems.map(m => m.mrp));

  console.log('\n📈 Data Summary:');
  console.log(`   Total Medicines: ${medicines.length}`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Priced Items: ${pricedItems.length}`);
  console.log(`   Price on Request: ${priceOnRequest.length}`);
  console.log(`   Price Range: ₹${minPrice.toFixed(2)} – ₹${maxPrice.toFixed(2)}`);

  console.log('\n✅ CSV processing complete!');
}

// Run
processCSV();
