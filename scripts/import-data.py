import pandas as pd
import json
import sys

def process_sections(file_path):
    """Process sections/departments from Excel"""
    df = pd.read_excel(file_path)
    
    sections = []
    for idx, row in df.iterrows():
        section_name = str(row['Descrição']).strip()
        if section_name and section_name != 'nan':
            sections.append({
                'id': idx + 1,
                'name': section_name,
                'code': f'DEPT{idx+1:03d}',
                'active': True
            })
    
    return sections

def process_employees(file_path):
    """Process employees from Excel"""
    df = pd.read_excel(file_path)
    
    employees = []
    for idx, row in df.iterrows():
        # Skip header or invalid rows
        if pd.isna(row['CHAPA']) or row['CHAPA'] == 'CHAPA':
            continue
            
        employee = {
            'id': idx + 1,
            'employee_code': str(int(row['CHAPA'])) if not pd.isna(row['CHAPA']) else '',
            'name': str(row['NOME']).strip() if not pd.isna(row['NOME']) else '',
            'position': str(row['CARGO']).strip() if not pd.isna(row['CARGO']) else '',
            'department': str(row['SEÇÃO']).strip() if not pd.isna(row['SEÇÃO']) else '',
            'corporate_email': str(row['EMAIL CORPORATIVO']).strip() if not pd.isna(row['EMAIL CORPORATIVO']) else '',
            'personal_email': str(row['EMAILPESSOAL']).strip() if not pd.isna(row['EMAILPESSOAL']) else '',
            'phone': str(row['TELEFONE']).strip() if not pd.isna(row['TELEFONE']) else '',
            'active': True
        }
        
        employees.append(employee)
    
    return employees

def main():
    # Process sections
    print("📊 Processing sections...")
    sections = process_sections('/home/ubuntu/upload/relaçãodeseções.XLSX')
    print(f"✅ Found {len(sections)} sections")
    
    # Process employees
    print("👥 Processing employees...")
    employees = process_employees('/home/ubuntu/upload/relaçãofuncionários.xlsx')
    print(f"✅ Found {len(employees)} employees")
    
    # Save to JSON files
    with open('/home/ubuntu/avd-uisa-sistema-completo/scripts/imported_sections.json', 'w', encoding='utf-8') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)
    
    with open('/home/ubuntu/avd-uisa-sistema-completo/scripts/imported_employees.json', 'w', encoding='utf-8') as f:
        json.dump(employees, f, ensure_ascii=False, indent=2)
    
    print("\n📁 Files saved:")
    print("  - imported_sections.json")
    print("  - imported_employees.json")
    
    # Statistics
    print("\n📈 Statistics:")
    print(f"  Total Sections: {len(sections)}")
    print(f"  Total Employees: {len(employees)}")
    print(f"  Employees with corporate email: {sum(1 for e in employees if e['corporate_email'] and '@uisa.com.br' in e['corporate_email'])}")
    print(f"  Employees with personal email: {sum(1 for e in employees if e['personal_email'])}")
    print(f"  Employees with phone: {sum(1 for e in employees if e['phone'])}")
    
    # Top departments by employee count
    dept_counts = {}
    for emp in employees:
        dept = emp['department']
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
    
    top_depts = sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    print("\n🏢 Top 10 Departments by Employee Count:")
    for dept, count in top_depts:
        print(f"  {dept}: {count} employees")

if __name__ == '__main__':
    main()
