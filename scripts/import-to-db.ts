import { drizzle } from 'drizzle-orm/mysql2';
import { departments, positions, employees } from '../drizzle/schema';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL = process.env.DATABASE_URL!;

async function importData() {
  console.log('🚀 Starting data import...\n');

  const db = drizzle(DATABASE_URL);

  // Read imported JSON files
  const sectionsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'imported_sections.json'), 'utf-8')
  );
  const employeesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'imported_employees.json'), 'utf-8')
  );

  console.log(`📊 Found ${sectionsData.length} sections`);
  console.log(`👥 Found ${employeesData.length} employees\n`);

  // Import departments
  console.log('📁 Importing departments...');
  const departmentMap = new Map<string, number>();
  
  for (const section of sectionsData) {
    try {
      const [result] = await db.insert(departments).values({
        name: section.name,
        code: section.code,
        description: null,
        managerId: null,
        active: section.active,
      });
      
      // @ts-ignore
      const insertId = result.insertId;
      departmentMap.set(section.name, insertId);
    } catch (error) {
      console.error(`  ❌ Error inserting department ${section.name}:`, error);
    }
  }
  console.log(`✅ Imported ${departmentMap.size} departments\n`);

  // Extract unique positions
  console.log('💼 Extracting unique positions...');
  const uniquePositions = new Set<string>();
  employeesData.forEach((emp: any) => {
    if (emp.position && emp.position.trim()) {
      uniquePositions.add(emp.position.trim());
    }
  });

  const positionMap = new Map<string, number>();
  for (const positionName of uniquePositions) {
    try {
      const [result] = await db.insert(positions).values({
        title: positionName,
        code: `POS${positionMap.size + 1}`,
        level: 'operacional',
        description: null,
        active: true,
      });
      
      // @ts-ignore
      const insertId = result.insertId;
      positionMap.set(positionName, insertId);
    } catch (error) {
      console.error(`  ❌ Error inserting position ${positionName}:`, error);
    }
  }
  console.log(`✅ Imported ${positionMap.size} positions\n`);

  // Import employees
  console.log('👥 Importing employees...');
  let successCount = 0;
  let errorCount = 0;

  for (const emp of employeesData) {
    try {
      const departmentId = departmentMap.get(emp.department);
      const positionId = positionMap.get(emp.position);

      // Use corporate email if available, otherwise personal email
      const email = emp.corporate_email || emp.personal_email || null;

      await db.insert(employees).values({
        employeeCode: emp.employee_code,
        name: emp.name,
        email: email,
        phone: emp.phone || null,
        departmentId: departmentId || null,
        positionId: positionId || null,
        managerId: null,
        hireDate: null,
        birthDate: null,
        status: emp.active ? 'ativo' : 'inativo',
      });

      successCount++;
      
      if (successCount % 100 === 0) {
        console.log(`  ⏳ Imported ${successCount} employees...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Error inserting employee ${emp.name}:`, error);
    }
  }

  console.log(`\n✅ Import completed!`);
  console.log(`  ✓ ${successCount} employees imported successfully`);
  console.log(`  ✗ ${errorCount} errors`);
  console.log(`\n📊 Summary:`);
  console.log(`  Departments: ${departmentMap.size}`);
  console.log(`  Positions: ${positionMap.size}`);
  console.log(`  Employees: ${successCount}`);
}

importData()
  .then(() => {
    console.log('\n🎉 Data import finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
