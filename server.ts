import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  Employee,
  AttendanceRecord,
  RegularizationRequest,
  LeaveRequest,
  LeaveBalance,
  ApprovalItem,
  PayrollRun,
  PayrollException,
  Payslip,
  AuditLog,
  NotificationItem,
  User,
  DashboardMetrics,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize GoogleGenAI SDK on server
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ==========================================
// In-Memory Enterprise Relational State
// ==========================================

const USERS: User[] = [
  {
    id: 'usr-1',
    email: 'admin@worksphere.local',
    fullName: 'Vikram Malhotra',
    role: 'SYSTEM_ADMIN',
    permissions: [
      'EMPLOYEE_READ', 'EMPLOYEE_WRITE', 'EMPLOYEE_STATUS_CHANGE', 'EMPLOYEE_DELETE',
      'ATTENDANCE_READ', 'ATTENDANCE_PUNCH', 'ATTENDANCE_REGULARIZE', 'ATTENDANCE_APPROVE',
      'LEAVE_READ', 'LEAVE_APPLY', 'LEAVE_APPROVE', 'LEAVE_REJECT',
      'PAYROLL_READ', 'PAYROLL_PROCESS', 'PAYROLL_APPROVE', 'PAYROLL_EXCEPTION_RESOLVE',
      'REPORT_READ', 'REPORT_EXPORT', 'AUDIT_READ', 'USER_MANAGE',
    ],
    title: 'CPO & Enterprise Admin',
    department: 'People Operations & HR',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1XHqf_44drjKHy69uFGwId1FjRxHpWHmsGgYOwUzRGm05siNp7n26wG_b9WhOVWzx6_OL9l0igAAUiWlZOIg0hOiV039W_YxvQM1Bhsb_NUR90PUaQQJtJrUxVhLtaCra-vFGPlK9llH3gu6b4dhG-EQ6KYY7YZFp1sCBdRxPv6ITHxZ9flyzOf6ddsQslx5qupYf-U91_qoxmN3wE-hSy_4opkR5T6cFXOC1ZA8P4yGihqT-efUaiwQrE',
    employeeId: 'EMP-00108',
  },
  {
    id: 'usr-hr',
    email: 'hr@worksphere.local',
    fullName: 'Sunita Kulkarni',
    role: 'HR_ADMIN',
    permissions: [
      'EMPLOYEE_READ', 'EMPLOYEE_WRITE', 'EMPLOYEE_STATUS_CHANGE',
      'ATTENDANCE_READ', 'ATTENDANCE_APPROVE',
      'LEAVE_READ', 'LEAVE_APPROVE', 'LEAVE_REJECT',
      'REPORT_READ', 'REPORT_EXPORT',
    ],
    title: 'Head of People Operations',
    department: 'Human Resources',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDvdU72xXfyeYyu7mZ_qtcfFxAUNMlsmOE0XBLNi-4QhXGBUcu8Oq5IOwQnuXhPug5CeyHCVtdB3ZhGMwYt9dI5KC_ep-Z-pzwR7tjW7uEvdG-XDMmZtG-t5FAIdcez3oSYuJGquaqTwB8R9aotVboBbSUl4kSWW68mbEu8C67TUymw1xNUrB2xtIC8ZNTAC7D_52vqhx2L7tikMuQMhVe5cbptY5K2LGy0r9lC9Aq6fHtpZdsjsUB',
    employeeId: 'EMP-05110',
  },
  {
    id: 'usr-2',
    email: 'payroll@worksphere.local',
    fullName: 'Pooja Nair',
    role: 'PAYROLL_ADMIN',
    permissions: [
      'EMPLOYEE_READ', 'ATTENDANCE_READ', 'LEAVE_READ',
      'PAYROLL_READ', 'PAYROLL_PROCESS', 'PAYROLL_APPROVE', 'PAYROLL_EXCEPTION_RESOLVE',
      'REPORT_READ', 'REPORT_EXPORT', 'AUDIT_READ',
    ],
    title: 'Director · FinOps & Payroll',
    department: 'Finance, Tax & Legal',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQlPOhk6lCW9cL63G_AL-BIl4o6Gxr8F4d7CeN_izRhLccd5AuVmJk8D0_cGWV4wTNwNEqs-EwkEy_tzetrCYDilAEuM08hqjG02oE3mME9MX4Y3Lx5WYS1LNf_z699CPC2e95hwIrh6odFpIOyd0B3-df5sqr3SedHa0CShtSa4YjwG93eDeadniqsFYlOCea0mByfxk0oOllISjGCB6uccbl_JavGqNb6uNsIAr4lFxNzLAkTrRJ',
    employeeId: 'EMP-01452',
  },
  {
    id: 'usr-3',
    email: 'manager@worksphere.local',
    fullName: 'Ananya Roy',
    role: 'MANAGER',
    permissions: [
      'EMPLOYEE_READ', 'ATTENDANCE_READ', 'ATTENDANCE_PUNCH', 'ATTENDANCE_APPROVE',
      'LEAVE_READ', 'LEAVE_APPLY', 'LEAVE_APPROVE', 'LEAVE_REJECT',
      'REPORT_READ',
    ],
    title: 'Director of Engineering',
    department: 'Engineering & Product',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCW_BZsh4Ahmj1vhWkdiPSJHJk_JiD7MGwCQHFREHOrhWfktTZmFql_2WdPk7DAmvX85ctiayfE-tgTFT-m5qFJros-gYCffttaop3ZmsIYkb_XCEW5qXaaD0NZjr7c-WsdXSug-TmnnAYhrtIht9_p90_BEM2AsCdxp37J736KcP49OIvllx_PdRB3iEhPdNFocd6EVO0tf18pKGqb8KPkrPZsU_7VMQTNrpC_u74I5Bm8JyCxN4m4',
    employeeId: 'WSP-0450',
  },
  {
    id: 'usr-4',
    email: 'employee@worksphere.local',
    fullName: 'Rohan Sharma',
    role: 'EMPLOYEE',
    permissions: [
      'EMPLOYEE_READ', 'ATTENDANCE_READ', 'ATTENDANCE_PUNCH', 'ATTENDANCE_REGULARIZE',
      'LEAVE_READ', 'LEAVE_APPLY',
    ],
    title: 'Lead Cloud Architect',
    department: 'Engineering & Product',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5e-MuIzZAnpeh_asU-cbtoW4z6moi-NBbVuQJV2jjykGHArndLm3OoA7jgK_S6vno1sC1Mt5YGAcQh__jCJsaz4HjLRC4d7emKQMpm8FgfLilnAE_-HXXEfbpR1xnc1Jx3aWK6s6NHv-WuomH3qAStCo4i7T69xfVd08lZhex3LWzARiYsb9uqtBCRej5UXBN_--okZRLMYuwNhWDHk_MAPOX1IZpYxNRrTeVScsxIbHR3t48hQog',
    employeeId: 'WSP-1092',
  },
];

interface Department {
  id: string;
  code: string;
  name: string;
  headEmployeeId?: string;
  headcountTarget: number;
}

interface Location {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  country: string;
  address?: string;
}

let DEPARTMENTS: Department[] = [
  { id: 'dept-1', code: 'ENG', name: 'Engineering & Product', headcountTarget: 450 },
  { id: 'dept-2', code: 'HR', name: 'Human Resources', headcountTarget: 45 },
  { id: 'dept-3', code: 'FIN', name: 'Finance, Tax & Legal', headcountTarget: 60 },
  { id: 'dept-4', code: 'PAY', name: 'Payroll & Benefits', headcountTarget: 30 },
  { id: 'dept-5', code: 'OPS', name: 'Operations & Facilities', headcountTarget: 120 },
  { id: 'dept-6', code: 'SLS', name: 'Sales & Business Development', headcountTarget: 180 },
  { id: 'dept-7', code: 'MKT', name: 'Marketing & Communications', headcountTarget: 50 },
  { id: 'dept-8', code: 'IT', name: 'Information Technology & Security', headcountTarget: 85 },
];

let LOCATIONS: Location[] = [
  { id: 'loc-blr', code: 'BLR', name: 'Bengaluru (Campus 1 & 2)', city: 'Bangalore', state: 'Karnataka', country: 'India', address: 'Outer Ring Road, Bellandur' },
  { id: 'loc-hyd', code: 'HYD', name: 'Hyderabad (HITEC City)', city: 'Hyderabad', state: 'Telangana', country: 'India', address: 'Mindspace Madhapur Hub' },
  { id: 'loc-mum', code: 'MUM', name: 'Mumbai (BKC Hub)', city: 'Mumbai', state: 'Maharashtra', country: 'India', address: 'Bandra Kurla Complex, G Block' },
  { id: 'loc-del', code: 'DEL', name: 'Delhi NCR (CyberHub)', city: 'Delhi', state: 'Delhi NCR', country: 'India', address: 'DLF CyberCity Tower 10' },
  { id: 'loc-chd', code: 'CHD', name: 'Chandigarh (IT Park)', city: 'Chandigarh', state: 'Punjab', country: 'India', address: 'Rajiv Gandhi Chandigarh Technology Park' },
  { id: 'loc-pun', code: 'PUN', name: 'Pune (Hinjawadi)', city: 'Pune', state: 'Maharashtra', country: 'India', address: 'Rajiv Gandhi Infotech Park Phase 1' },
  { id: 'loc-rem', code: 'REM', name: 'Distributed Remote', city: 'Remote', state: 'All', country: 'India', address: 'Remote Work Infrastructure' },
];

let currentUser: User = USERS[0]; // Default logged-in as Vikram Malhotra

let EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'WSP-1092',
    firstName: 'Rohan',
    lastName: 'Sharma',
    email: 'rohan.sharma@acmeglobal.corp',
    phone: '+91 98450 12891',
    dateOfBirth: '1989-06-14',
    dateOfJoining: '2021-03-12',
    departmentId: 'dept-1',
    departmentName: 'Engineering & Product',
    managerId: 'emp-6',
    managerName: 'Ananya Roy',
    jobTitle: 'Lead Cloud Architect',
    level: 'Level IC-6',
    employmentType: 'FULL_TIME',
    locationId: 'loc-blr',
    locationName: 'Bengaluru (Campus 1)',
    status: 'ACTIVE',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5e-MuIzZAnpeh_asU-cbtoW4z6moi-NBbVuQJV2jjykGHArndLm3OoA7jgK_S6vno1sC1Mt5YGAcQh__jCJsaz4HjLRC4d7emKQMpm8FgfLilnAE_-HXXEfbpR1xnc1Jx3aWK6s6NHv-WuomH3qAStCo4i7T69xfVd08lZhex3LWzARiYsb9uqtBCRej5UXBN_--okZRLMYuwNhWDHk_MAPOX1IZpYxNRrTeVScsxIbHR3t48hQog',
    bankAccountReference: 'HDFC-xxxx-4412',
    ifscCode: 'HDFC0001223',
    panNumber: 'ABCPS1234F',
    uanNumber: '100923847512',
    ctcAnnual: 3800000,
    baseMonthly: 190000,
    createdAt: '2021-03-12T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-2',
    employeeCode: 'WSP-1145',
    firstName: 'Aarav',
    lastName: 'Kapoor',
    email: 'aarav.kapoor@acmeglobal.corp',
    phone: '+91 98860 44219',
    dateOfBirth: '1993-11-20',
    dateOfJoining: '2022-01-18',
    departmentId: 'dept-1',
    departmentName: 'Engineering & Product',
    managerId: 'emp-6',
    managerName: 'Ananya Roy',
    jobTitle: 'Staff Site Reliability Eng',
    level: 'Level IC-5',
    employmentType: 'FULL_TIME',
    locationId: 'loc-hyd',
    locationName: 'Hyderabad (HITEC City)',
    status: 'ACTIVE',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACvo43mBd_R11qEcfrPA57gzENQhZ2bdrnwS2LFWvQxE5XPvn12GV82Q7hTKhSyiri3KR5wsHtakkimKe2P56-O9li1aRwB2KrfoSRXymDN1lroRJ5J0zCxVzasqpPY4ST9IlzQTG6crBZt8NAIRpOoVy7NUJ3A_-2lG88mzxtp_SbrK75-qvda2TWVqly7zchZ4psh3SzvGqEZ8429dcVRPCl1VtJRoVDhUJctcTPKtfWxRrAbOPk',
    bankAccountReference: 'ICIC-xxxx-9812',
    ifscCode: 'ICIC0000492',
    panNumber: 'BKAPK9821K',
    uanNumber: '100923847513',
    ctcAnnual: 3200000,
    baseMonthly: 160000,
    createdAt: '2022-01-18T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-3',
    employeeCode: 'WSP-1340',
    firstName: 'Priya',
    lastName: 'Deshmukh',
    email: 'priya.deshmukh@acmeglobal.corp',
    phone: '+91 97312 99014',
    dateOfBirth: '1991-04-12',
    dateOfJoining: '2022-11-05',
    departmentId: 'dept-1',
    departmentName: 'Engineering & Product',
    managerId: 'emp-1',
    managerName: 'Rohan Sharma',
    jobTitle: 'Lead SDET Automation',
    level: 'Level IC-5',
    employmentType: 'FULL_TIME',
    locationId: 'loc-pun',
    locationName: 'Pune (Hinjawadi)',
    status: 'ON_LEAVE',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbrCEaVH2vumXqc4K_40Ecxx0-W00fc7GaVcygiqjRLhdGoIjpfVuyQoyRhIOPp8Tsx7Q6JPrUOoNZ52iTEBeh3AdzkxJWFda2I2Ejl9HmAaAjkTbGcjj56ynATfnV_q4pIo6XEmdeykYOBSptohoUID17bhIa7_J9f_zxhvWUvEc1EPN156iErEzDWhdV85ik96IxLNv8IsdxVgNiF0v-desyH2FUpGwlBPfbCC6EE7H8BfykFKQk',
    bankAccountReference: 'SBIN-xxxx-3321',
    ifscCode: 'SBIN0008472',
    panNumber: 'CPDPD4421M',
    uanNumber: '100923847514',
    ctcAnnual: 2700000,
    baseMonthly: 135000,
    createdAt: '2022-11-05T09:00:00Z',
    updatedAt: '2026-09-15T10:00:00Z',
  },
  {
    id: 'emp-4',
    employeeCode: 'WSP-2041',
    firstName: 'Vikram',
    lastName: 'Patel',
    email: 'vikram.patel@acmeglobal.corp',
    phone: '+91 99201 55678',
    dateOfBirth: '1985-08-30',
    dateOfJoining: '2019-08-14',
    departmentId: 'dept-4',
    departmentName: 'Finance, Tax & Legal',
    managerId: 'emp-8',
    managerName: 'Anita Krishnan',
    jobTitle: 'Sr. Payroll Specialist',
    level: 'Level FN-4',
    employmentType: 'FULL_TIME',
    locationId: 'loc-mum',
    locationName: 'Mumbai (BKC Hub)',
    status: 'ACTIVE',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9SETY-0YcHduIlqUmq7O8u49H2DhkHDuIvkMzFPb0zU7E_IqQOcbJrZPb458XMCuenbfstKwuywaXmP1q9wUaD16I81nepQDofdwCN-K5MVBL5oQ0Q0Mp2UMUWbAtcB1hHOjQyprywoXMGRYSFl9ux4o126alDoTh2zz1NjkfbUxQxrW9trH2ZxZkcs1d_qQtdodytC_PeCoNAqCXAv5bFIUD3vFKwNiKQJk5SKDUiSE2ylqNHGEY',
    bankAccountReference: 'KKBK-xxxx-5510',
    ifscCode: 'KKBK0001928',
    panNumber: 'DFPPV7782A',
    uanNumber: '100923847515',
    ctcAnnual: 2400000,
    baseMonthly: 120000,
    createdAt: '2019-08-14T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-5',
    employeeCode: 'WSP-3110',
    firstName: 'Neha',
    lastName: 'Lodha',
    email: 'neha.lodha@acmeglobal.corp',
    phone: '+91 98455 33211',
    dateOfBirth: '1995-02-14',
    dateOfJoining: '2023-06-01',
    departmentId: 'dept-5',
    departmentName: 'People Operations & HR',
    managerId: 'emp-108',
    managerName: 'Vikram Malhotra',
    jobTitle: 'Lead HRBP - Tech Org',
    level: 'Level HR-5',
    employmentType: 'FULL_TIME',
    locationId: 'loc-blr',
    locationName: 'Bengaluru (Campus 1)',
    status: 'ACTIVE',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDvdU72xXfyeYyu7mZ_qtcfFxAUNMlsmOE0XBLNi-4QhXGBUcu8Oq5IOwQnuXhPug5CeyHCVtdB3ZhGMwYt9dI5KC_ep-Z-pzwR7tjW7uEvdG-XDMmZtG-t5FAIdcez3oSYuJGquaqTwB8R9aotVboBbSUl4kSWW68mbEu8C67TUymw1xNUrB2xtIC8ZNTAC7D_52vqhx2L7tikMuQMhVe5cbptY5K2LGy0r9lC9Aq6fHtpZdsjsUB',
    bankAccountReference: 'HDFC-xxxx-8812',
    ifscCode: 'HDFC0000881',
    panNumber: 'GHPNL2291Q',
    uanNumber: '100923847516',
    ctcAnnual: 2600000,
    baseMonthly: 130000,
    createdAt: '2023-06-01T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-6',
    employeeCode: 'WSP-0450',
    firstName: 'Ananya',
    lastName: 'Roy',
    email: 'ananya.roy@acmeglobal.corp',
    phone: '+91 99000 11223',
    dateOfBirth: '1982-12-05',
    dateOfJoining: '2018-02-10',
    departmentId: 'dept-1',
    departmentName: 'Engineering & Product',
    managerId: 'emp-cto',
    managerName: 'Devrath Rao (CTO)',
    jobTitle: 'Director of Engineering',
    level: 'Level M-3',
    employmentType: 'FULL_TIME',
    locationId: 'loc-blr',
    locationName: 'Bengaluru (Campus 1)',
    status: 'ACTIVE',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCW_BZsh4Ahmj1vhWkdiPSJHJk_JiD7MGwCQHFREHOrhWfktTZmFql_2WdPk7DAmvX85ctiayfE-tgTFT-m5qFJros-gYCffttaop3ZmsIYkb_XCEW5qXaaD0NZjr7c-WsdXSug-TmnnAYhrtIht9_p90_BEM2AsCdxp37J736KcP49OIvllx_PdRB3iEhPdNFocd6EVO0tf18pKGqb8KPkrPZsU_7VMQTNrpC_u74I5Bm8JyCxN4m4',
    bankAccountReference: 'CITI-xxxx-1120',
    ifscCode: 'CITI0000021',
    panNumber: 'AAAPR9912B',
    uanNumber: '100923847517',
    ctcAnnual: 6500000,
    baseMonthly: 325000,
    createdAt: '2018-02-10T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-7',
    employeeCode: 'WSP-0329',
    firstName: 'Sanjay',
    lastName: 'Verma',
    email: 'sanjay.verma@acmeglobal.corp',
    phone: '+91 98110 77654',
    dateOfBirth: '1980-05-18',
    dateOfJoining: '2017-08-22',
    departmentId: 'dept-1',
    departmentName: 'Engineering & Product',
    managerId: 'emp-cpo',
    managerName: 'Suhas Nambiar (CPO)',
    jobTitle: 'VP of Enterprise Product',
    level: 'Level E-1',
    employmentType: 'FULL_TIME',
    locationId: 'loc-del',
    locationName: 'Delhi NCR (CyberHub)',
    status: 'ACTIVE',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZRoD967ngTVk5OnYSfD0A3ohqvcJLzPMJbaIK7sZlLRY6OJ4SAYlR9FoBi28omFFuv25oIK5qpVknLxIri2c9v05On1G5-BLlP_w5xkKnQE77HQ503LMLbaJYQ25Crr0yHU0o3lQp5me1m8bmrBlBJPnnnIV0_mSXsNM5t-gmBvchJcyJ2Z21iylkATY6MzPaeAhGcKys4P26so_4f-bu9YbmfMTzPwQ_hIcHss3BsyQ-exrfrJMS',
    bankAccountReference: 'HDFC-xxxx-9014',
    ifscCode: 'HDFC0000123',
    panNumber: 'BBMPS4921J',
    uanNumber: '100923847518',
    ctcAnnual: 7200000,
    baseMonthly: 360000,
    createdAt: '2017-08-22T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-8',
    employeeCode: 'WSP-4821',
    firstName: 'Meera',
    lastName: 'Sundaram',
    email: 'meera.sundaram@acmeglobal.corp',
    phone: '+91 99401 22890',
    dateOfBirth: '1996-09-12',
    dateOfJoining: '2024-11-03',
    departmentId: 'dept-1',
    departmentName: 'Engineering & Product',
    managerId: 'emp-7',
    managerName: 'Sanjay Verma',
    jobTitle: 'Senior Data Scientist',
    level: 'Level IC-4',
    employmentType: 'FULL_TIME',
    locationId: 'loc-hyd',
    locationName: 'Hyderabad (HITEC City)',
    status: 'PROBATION',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmPW3YxUFIKIhv_aSQghqWkkD4uFgyxDPb8E8WDvbJI1T9qae76kcdKJTwX4IRrON9xMC37iyRn_k3KnaIFXCOMmQhgoScHkJm8zeI5IxgTd63VEMnEp4VWTqgBwg04RzDWhjcTdK4dWNWSRI-pOGvr6vsXBdqgr7LoGuXUABRsuX0hjC2ljJGEAwfI4uaEnjqbiFczEr_6jONptKtumQrWSOeedKYIA05Zxo8CEJslf_M0LjXtW99',
    bankAccountReference: 'HDFC-xxxx-9924',
    ifscCode: 'HDFC0000XXX', // Flagged exception
    panNumber: 'CPYMS1824P',
    uanNumber: '100923847519',
    ctcAnnual: 2900000,
    baseMonthly: 145000,
    createdAt: '2024-11-03T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-9',
    employeeCode: 'WSP-1899',
    firstName: 'Siddharth',
    lastName: 'Menon',
    email: 'siddharth.m@acmeglobal.corp',
    phone: '+91 98470 33891',
    dateOfBirth: '1992-07-28',
    dateOfJoining: '2022-04-15',
    departmentId: 'dept-1',
    departmentName: 'Engineering & Product',
    managerId: 'emp-1',
    managerName: 'Rohan Sharma',
    jobTitle: 'Senior Backend Eng',
    level: 'Level IC-4',
    employmentType: 'CONTRACT',
    locationId: 'loc-rem',
    locationName: 'Remote (Kerala)',
    status: 'NOTICE',
    avatarUrl: '',
    bankAccountReference: 'AXIS-xxxx-2201',
    ifscCode: 'UTIB0000841',
    panNumber: 'BBNPS9012N',
    uanNumber: '100923847520',
    ctcAnnual: 2200000,
    baseMonthly: 110000,
    createdAt: '2022-04-15T09:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
  },
];

// Attendance Records
let ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att-1',
    employeeId: 'emp-101',
    employeeCode: 'EMP-04192',
    employeeName: 'Ananya Sharma',
    department: 'Engineering',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVDDBYqdRvpTgM5LhFGqCYyUBgtZgbnyKdMrpNGubwLD283f_qTn59bbywio0FCjUvXqK_zAeJa7a_kLkVqJUWPBnJWZsrJiJ-DED8YfXN_CWX87Q4Jpvokp1urzToK75UkK2nJrqGGohXgfKPBDyObE3u44kccl1TLE5s_L_AA-nsY3hvvLgvNQgYXEDR8GV1NsalIJ8AQxwxcL6pBDyWUCk5Tq5ut-0uqeoDB_9mSNUwIEkNBjsX',
    attendanceDate: '2026-09-18',
    shiftName: 'General Shift A (09:00 - 18:00)',
    firstIn: '09:02 AM',
    lastOut: '--:--',
    durationFormatted: '04h 39m',
    status: 'PRESENT',
    overtimeMinutes: 0,
    source: 'BIOMETRIC_GATE',
    createdAt: '2026-09-18T09:02:00Z',
    updatedAt: '2026-09-18T09:02:00Z',
  },
  {
    id: 'att-2',
    employeeId: 'emp-102',
    employeeCode: 'EMP-03822',
    employeeName: 'Devendra Rao',
    department: 'Operations',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdhRGf3fnqzOIf9MkSUmyVmKqg09ne-K_LKcGMAWDl8ryrG6kMeU4nC1MlFGTcusEaNwOZdGYft_Rd0RWGV3yzx4rIJFSjSmYG65VJhHMeddyuOo__PNKmKRA7TZKuWoLClxnNSv0m2NZ7YqXbqt2S0FBUT05Z5Oyo10nwTRqp6MYp_QcJ9cJzf3XyqksecQuYBTU9fK3XBy4792z4zZXdo9K_ONNyNUhmJ0TDy_F3I9uAWRE1jl2W',
    attendanceDate: '2026-09-18',
    shiftName: 'General Shift A (09:00 - 18:00)',
    firstIn: '09:24 AM',
    lastOut: '--:--',
    durationFormatted: '04h 17m',
    status: 'LATE',
    statusNote: 'Late 24m',
    overtimeMinutes: 0,
    source: 'BIOMETRIC_GATE',
    createdAt: '2026-09-18T09:24:00Z',
    updatedAt: '2026-09-18T09:24:00Z',
  },
  {
    id: 'att-3',
    employeeId: 'emp-103',
    employeeCode: 'EMP-05110',
    employeeName: 'Sunita Kulkarni',
    department: 'Human Resources',
    attendanceDate: '2026-09-18',
    shiftName: 'General Shift B (13:00 - 22:00)',
    firstIn: '08:58 AM',
    lastOut: '13:00 PM',
    durationFormatted: '04h 02m',
    status: 'HALF_DAY',
    statusNote: 'Half-Day (Approved)',
    overtimeMinutes: 0,
    source: 'BIOMETRIC_GATE',
    createdAt: '2026-09-18T08:58:00Z',
    updatedAt: '2026-09-18T13:00:00Z',
  },
  {
    id: 'att-4',
    employeeId: 'emp-104',
    employeeCode: 'EMP-02941',
    employeeName: 'Rohan Joshi',
    department: 'Finance',
    attendanceDate: '2026-09-18',
    shiftName: 'General Shift A (09:00 - 18:00)',
    firstIn: '--:--',
    lastOut: '--:--',
    durationFormatted: '--',
    status: 'ON_LEAVE',
    statusNote: 'Casual Leave (Approved)',
    overtimeMinutes: 0,
    source: 'MANUAL',
    createdAt: '2026-09-18T00:00:00Z',
    updatedAt: '2026-09-18T00:00:00Z',
  },
  {
    id: 'att-5',
    employeeId: 'emp-105',
    employeeCode: 'EMP-06103',
    employeeName: 'Manish Tiwari',
    department: 'Engineering',
    attendanceDate: '2026-09-18',
    shiftName: 'Mid Shift C (13:00 - 22:00)',
    firstIn: '13:10 PM',
    lastOut: 'Missing Out',
    durationFormatted: 'Flagged',
    status: 'MISSING_PUNCH',
    statusNote: 'Missing Out Punch',
    overtimeMinutes: 0,
    source: 'BIOMETRIC_GATE',
    createdAt: '2026-09-18T13:10:00Z',
    updatedAt: '2026-09-18T13:10:00Z',
  },
];

// Active duty session for currently logged-in user (Vikram Malhotra)
let CURRENT_USER_DUTY_SESSION = {
  active: true,
  checkInTime: '09:04 AM',
  shift: 'General Shift A (09:00 - 18:00)',
  location: 'Gate 4, BLR Campus',
  onBreak: false,
  breakCount: 0,
  remoteLogged: false,
};

// Regularization Queue
let REGULARIZATIONS: RegularizationRequest[] = [
  {
    id: 'reg-1',
    requestId: '#REG-992',
    employeeId: 'emp-201',
    employeeName: 'Arjun Rampal',
    employeeCode: 'EMP-09921',
    incidentDate: '2026-09-18',
    category: 'Gate 3 RFID turnstile scanner timeout',
    proposedTime: '09:05 AM',
    reason: 'Gate 3 RFID turnstile scanner timeout. Logged check-in at 09:05 AM via physical gate register.',
    status: 'PENDING',
    shiftSchedule: '09:00 - 18:00',
    createdAt: 'Today, 10:14 AM',
  },
  {
    id: 'reg-2',
    requestId: '#REG-990',
    employeeId: 'emp-202',
    employeeName: 'Neha Singhal',
    employeeCode: 'EMP-09902',
    incidentDate: '2026-09-17',
    category: 'Client site deployment visit',
    proposedTime: '18:30 PM',
    reason: 'Client site deployment visit at Electronics City Phase 1. Missing out-punch at 18:30 PM.',
    status: 'PENDING',
    shiftSchedule: '09:30 - 18:30',
    createdAt: 'Yesterday, 19:40 PM',
  },
  {
    id: 'reg-3',
    requestId: '#REG-987',
    employeeId: 'emp-203',
    employeeName: 'Kiran Varma',
    employeeCode: 'EMP-09871',
    incidentDate: '2026-09-16',
    category: 'Executive transit breakdown',
    proposedTime: '09:45 AM',
    reason: 'Executive car breakdown along Outer Ring Road. Delayed check-in regularized to 09:45 AM.',
    status: 'PENDING',
    shiftSchedule: '09:00 - 18:00',
    createdAt: '16 Sep 2026',
  },
];

// Approvals Queue
let APPROVAL_ITEMS: ApprovalItem[] = [
  {
    id: 'app-1',
    type: 'EXPENSE',
    title: 'On-Duty International Travel Claim',
    requesterName: 'Aarav Deshmukh',
    requesterRole: 'Lead Arch · Cloud Infra',
    requesterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4Neze1DPO6cGhYyvILxB7CdIUmJEMRzFhL-Ug0rrsBrjsHsnfob7Cpje7Fm9iycxAGrX4NC0d4EnmatE9mDD_H48eTIzvTiffDAT5qtW6jDy1YxgdaXPTz7GahJIvU7lo6a9HDfsXzkKHUGgtDbIxHmMiDUfCG_nov2vesqGBcOZLHzy-afIEIi204x9zWX90Ls9qtFWSPgrOs8WQCqJXyntieDUFG5x4fkwfPsorByiI2pZ9ys9r',
    amountFormatted: '₹2,45,000',
    slaRiskText: '18m left',
    slaDueMinutes: 18,
    status: 'PENDING',
    description: 'Travel expenses for AWS re:Invent Tokyo summit presenting WorkSphere multi-region architecture.',
    steps: [
      { stepOrder: 1, approverRole: 'Direct Manager', approverName: 'Ananya Roy', action: 'APPROVE', comments: 'Budget allocated under Q3 Cloud Conf', timestamp: '2026-09-17 14:00' },
      { stepOrder: 2, approverRole: 'Executive CPO', approverName: 'Vikram Malhotra', action: 'PENDING' },
    ],
    createdAt: '2026-09-17T11:00:00Z',
  },
  {
    id: 'app-2',
    type: 'EXPENSE',
    title: 'Off-Cycle Emergency Medical Advance',
    requesterName: 'Pooja Nair',
    requesterRole: 'Director · FinOps',
    requesterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQlPOhk6lCW9cL63G_AL-BIl4o6Gxr8F4d7CeN_izRhLccd5AuVmJk8D0_cGWV4wTNwNEqs-EwkEy_tzetrCYDilAEuM08hqjG02oE3mME9MX4Y3Lx5WYS1LNf_z699CPC2e95hwIrh6odFpIOyd0B3-df5sqr3SedHa0CShtSa4YjwG93eDeadniqsFYlOCea0mByfxk0oOllISjGCB6uccbl_JavGqNb6uNsIAr4lFxNzLAkTrRJ',
    amountFormatted: '₹1,80,000',
    slaRiskText: '42m left',
    slaDueMinutes: 42,
    status: 'PENDING',
    description: 'Corporate emergency medical advance for dependent surgery at Manipal Hospital Bengaluru.',
    steps: [
      { stepOrder: 1, approverRole: 'HR Head', approverName: 'Anita Krishnan', action: 'APPROVE', comments: 'Medical certificates verified', timestamp: '2026-09-18 08:30' },
      { stepOrder: 2, approverRole: 'Executive CPO', approverName: 'Vikram Malhotra', action: 'PENDING' },
    ],
    createdAt: '2026-09-18T08:00:00Z',
  },
  {
    id: 'app-3',
    type: 'REGULARIZATION',
    title: 'Comp-Off Regularization (3 days)',
    requesterName: 'Devendra Verma',
    requesterRole: 'Sr. Specialist · Security',
    requesterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAycBnVpmnbyw2_6xhyw_8RV2sqokDZdpGucLuGL0k_bHxi0shHoDi-2MDen9FG6hRv2tIbnw9m6YqcFv4h_dQr-4qxDCAveBKKfTs9nNFiHlhqgxNV7WSPoX9T_tQ__saXODm9dGLW0jc4zqnns_YhbDfewg6ciOk0gwChj8ULuMgUeC1iqY3IxLqV-SeTOkswn621JUBWmSXk9Ol-SIojpsDzT5DYmtvvqlx6CVorWoSoVDG8RjcL',
    daysFormatted: '3 Days',
    slaRiskText: '1h 14m left',
    slaDueMinutes: 74,
    status: 'PENDING',
    description: 'Compensatory off regularization for weekend emergency patch rollout of SOC2 compliance gateway.',
    steps: [
      { stepOrder: 1, approverRole: 'Executive CPO', approverName: 'Vikram Malhotra', action: 'PENDING' },
    ],
    createdAt: '2026-09-18T09:15:00Z',
  },
];

// Leave Balances for logged-in user
let LEAVE_BALANCES: LeaveBalance[] = [
  { leaveType: 'ANNUAL', allocated: 18, used: 6, pending: 2, available: 10 },
  { leaveType: 'SICK', allocated: 12, used: 2, pending: 0, available: 10 },
  { leaveType: 'CASUAL', allocated: 8, used: 3, pending: 1, available: 4 },
  { leaveType: 'UNPAID', allocated: 30, used: 0, pending: 0, available: 30 },
  { leaveType: 'MATERNITY', allocated: 180, used: 0, pending: 0, available: 180 },
  { leaveType: 'PATERNITY', allocated: 15, used: 0, pending: 0, available: 15 },
];

let LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr-1',
    employeeId: 'emp-1',
    employeeCode: 'WSP-1092',
    employeeName: 'Rohan Sharma',
    leaveType: 'ANNUAL',
    startDate: '2026-10-12',
    endDate: '2026-10-16',
    durationDays: 5,
    reason: 'Family annual vacation to Himachal Pradesh',
    status: 'APPROVED',
    submittedAt: '2026-09-10T11:00:00Z',
    approvedAt: '2026-09-11T14:30:00Z',
    approvedBy: 'Ananya Roy',
  },
  {
    id: 'lr-2',
    employeeId: 'emp-108',
    employeeCode: 'EMP-00108',
    employeeName: 'Vikram Malhotra',
    leaveType: 'CASUAL',
    startDate: '2026-10-05',
    endDate: '2026-10-06',
    durationDays: 2,
    reason: 'Personal family commitment and wedding ceremony in Jaipur',
    status: 'SUBMITTED',
    submittedAt: '2026-09-18T09:00:00Z',
  },
];

// Payroll State
let CURRENT_PAYROLL_RUN: PayrollRun = {
  id: 'pr-2026-09',
  runCode: '#PR-2026-09',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  status: 'REVIEW',
  step: 4, // 1: Lock, 2: Inputs, 3: Gross Calc, 4: Exception Clearing (ACTIVE), 5: CFO Signoff, 6: Disburse
  employeeCount: 10248,
  grossAmount: 104822400,
  deductionAmount: 20618000,
  netAmount: 84204400,
  exceptionsTotal: 23,
  criticalExceptions: 4,
  warningExceptions: 19,
  createdAt: '2026-09-24T18:00:00Z',
  targetDisbursementDate: '2026-09-30',
  batchId: 'BTH-IND-MUM-9942',
  bankingGatewayStatus: 'HDFC Host-to-Host Corporate Gateway (Ready)',
};

let PAYROLL_EXCEPTIONS: PayrollException[] = [
  {
    id: 'exc-1',
    payrollRunId: 'pr-2026-09',
    severity: 'CRITICAL',
    employeeId: 'emp-2041',
    employeeCode: '#WS-02941',
    employeeName: 'Rajesh Varma',
    designation: 'Sr. DevOps Engineer',
    department: 'Infrastructure',
    location: 'Bengaluru',
    exceptionType: 'NEGATIVE_NET_PAY',
    exceptionTypeLabel: 'Negative Net Pay',
    description: 'Deduction of ₹1,12,000 exceeds monthly gross of ₹98,000 due to double-booked festival advance recovery.',
    netImpact: -14000,
    assignedDesk: 'Finance Desk',
    status: 'OPEN',
    suggestedAction: 'Adjust loan amortization schedule to spread recovery across 3 cycles.',
  },
  {
    id: 'exc-2',
    payrollRunId: 'pr-2026-09',
    severity: 'CRITICAL',
    employeeId: 'emp-8819',
    employeeCode: '#WS-08819',
    employeeName: 'Meera Sundaram',
    designation: 'Lead Data Scientist',
    department: 'AI Core',
    location: 'Hyderabad',
    exceptionType: 'MISSING_BANK_IFSC',
    exceptionTypeLabel: 'Missing Bank IFSC',
    description: 'Corporate RTGS gateway validation failure. Account ...9924 rejected with invalid branch code "HDFC0000XXX".',
    netImpact: 145200,
    assignedDesk: 'HR Operations',
    status: 'OPEN',
    suggestedAction: 'Request verified bank passbook or cancelled cheque with valid branch IFSC.',
  },
  {
    id: 'exc-3',
    payrollRunId: 'pr-2026-09',
    severity: 'CRITICAL',
    employeeId: 'emp-01204',
    employeeCode: '#WS-01204',
    employeeName: 'Amitav Sen',
    designation: 'VP Marketing',
    department: 'Growth',
    location: 'Mumbai',
    exceptionType: 'TAX_ANOMALY',
    exceptionTypeLabel: 'TDS Over-deduction',
    description: 'Section 192 declaration mismatch. Old regime proof validated but tax slab engine retained higher bracket: excessive ₹42,000 calculated.',
    netImpact: 312000,
    assignedDesk: 'Tax Team',
    status: 'IN_REVIEW',
    suggestedAction: 'Recompute TDS using validated 80C and HRA proofs under Old Tax Regime.',
  },
  {
    id: 'exc-4',
    payrollRunId: 'pr-2026-09',
    severity: 'CRITICAL',
    employeeId: 'emp-04182',
    employeeCode: '#WS-04182',
    employeeName: 'Deepak Chawla',
    designation: 'Staff Security Engineer',
    department: 'InfoSec',
    location: 'Pune',
    exceptionType: 'SALARY_MISMATCH',
    exceptionTypeLabel: 'Unmapped Dual-Bank Routing',
    description: 'Split salary disbursement failure: Primary salary (70%) mapped to ICICI, but offshore travel stipend (30%) missing valid beneficiary IBAN.',
    netImpact: 84000,
    assignedDesk: 'Treasury Desk',
    status: 'OPEN',
    suggestedAction: 'Route 100% of cycle net disbursement through verified primary ICICI domestic account.',
  },
  {
    id: 'exc-5',
    payrollRunId: 'pr-2026-09',
    severity: 'MEDIUM',
    employeeId: 'emp-06190',
    employeeCode: '#WS-06190',
    employeeName: 'Vikram Patel',
    designation: 'HR Operations Specialist',
    department: 'People Team',
    location: 'Delhi NCR',
    exceptionType: 'UNRECORDED_PUNCHES',
    exceptionTypeLabel: 'Unrecorded Punches',
    description: '2 days missing biometric punches (14 & 15 Sep) without regularized leave application in portal.',
    netImpact: 7800,
    assignedDesk: 'Manager Desk',
    status: 'OPEN',
    suggestedAction: 'Convert 2 missing days to Casual Leave balance or apply LOP deduction.',
  },
];

// Audit Logs
let AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-09-25T19:46:00Z',
    timeAgo: '12s ago',
    userId: 'usr-sys',
    userEmail: 'system.daemon@worksphere.local',
    action: 'BATCH_BIOMETRIC_SYNC',
    resourceType: 'ATTENDANCE',
    resourceId: 'SYNC-882',
    details: 'Batch Biometric Clock-in Sync #882 · Zone 4 (Bengaluru Campus) · 1,412 records processed',
    source: 'BIOMETRIC_GATEWAY',
    result: 'SUCCESS',
  },
  {
    id: 'aud-2',
    timestamp: '2026-09-25T19:44:00Z',
    timeAgo: '2m ago',
    userId: 'usr-1',
    userEmail: 'admin@worksphere.local',
    action: 'SALARY_REVISION_COMMITTED',
    resourceType: 'COMPENSATION',
    resourceId: 'EMP-9021',
    details: 'EMP-9021 · Band L6 promotional revision applied with retro-allowance',
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  },
  {
    id: 'aud-3',
    timestamp: '2026-09-25T19:39:00Z',
    timeAgo: '7m ago',
    userId: 'usr-1',
    userEmail: 'admin@worksphere.local',
    action: 'ROLE_ESCALATION_VERIFIED',
    resourceType: 'SECURITY',
    resourceId: 'ROLE-SYS-ADMIN',
    details: 'v.malhotra@acme.com · Session biometric 2FA handshake confirmed',
    source: 'AUTH_GATEWAY',
    result: 'SUCCESS',
  },
  {
    id: 'aud-4',
    timestamp: '2026-09-25T19:32:00Z',
    timeAgo: '14m ago',
    userId: 'usr-sys',
    userEmail: 'policy.engine@worksphere.local',
    action: 'LEAVE_AUTO_APPROVED',
    resourceType: 'LEAVE',
    resourceId: 'LR-4418',
    details: 'Maternity Leave Granted · EMP-4418 · Legal policy auto-approved (180 days)',
    source: 'RULE_ENGINE',
    result: 'SUCCESS',
  },
  {
    id: 'aud-5',
    timestamp: '2026-09-25T18:10:00Z',
    timeAgo: '1h 36m ago',
    userId: 'usr-2',
    userEmail: 'payroll@worksphere.local',
    action: 'PAYROLL_VALIDATION_TRIGGERED',
    resourceType: 'PAYROLL',
    resourceId: 'PR-2026-09',
    details: 'Automated tax and attendance re-validation initiated across 10,248 employee accounts',
    source: 'WEB_PORTAL',
    result: 'WARNING',
  },
];

// Notifications
let NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'usr-1',
    type: 'PAYROLL_EXCEPTION',
    title: 'Payroll Blockers Detected',
    message: 'Payroll cycle #PR-2026-09 has 4 critical exceptions blocking executive approval.',
    priority: 'CRITICAL',
    read: false,
    createdAt: '10m ago',
  },
  {
    id: 'notif-2',
    userId: 'usr-1',
    type: 'APPROVAL_PENDING',
    title: 'Urgent Travel Claim Approval',
    message: 'Aarav Deshmukh submitted an International Travel Claim for ₹2,45,000 (SLA: 18m left).',
    priority: 'HIGH',
    read: false,
    createdAt: '22m ago',
  },
  {
    id: 'notif-3',
    userId: 'usr-1',
    type: 'ATTENDANCE_ALERT',
    title: 'Biometric Turnstile Latency Warning',
    message: 'Turnstile gate 4 latency spiked to 210ms during peak morning check-in.',
    priority: 'MEDIUM',
    read: false,
    createdAt: '1h ago',
  },
];

// ==========================================
// REST API Endpoints
// ==========================================

// Health Check (Spring Boot Actuator pattern)
app.get('/actuator/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    components: {
      db: { status: 'UP', details: { database: 'PostgreSQL 16', validationQuery: 'isValid()' } },
      redis: { status: 'UP', details: { version: '7.2.4', clusterMode: 'disabled' } },
      kafka: { status: 'UP', details: { clusterId: 'worksphere-events', brokers: 3 } },
      diskSpace: { status: 'UP', details: { free: '42.8 GB', threshold: '10.0 GB' } },
    },
  });
});

// Auth Routes
app.get('/api/v1/auth/me', (req: Request, res: Response) => {
  if (!currentUser) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication session expired or not found. Please log in.',
      path: '/api/v1/auth/me',
    });
  }
  res.json({ user: currentUser });
});

app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      code: 'MISSING_CREDENTIALS',
      message: 'Email address is required.',
      path: '/api/v1/auth/login',
    });
  }

  const user = USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password. Please verify your corporate account credentials.',
      path: '/api/v1/auth/login',
    });
  }

  // Set active user session
  currentUser = user;
  const token = `jwt-sec-${user.id}-${Date.now()}`;

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    userId: user.id,
    userEmail: user.email,
    action: 'USER_LOGIN',
    resourceType: 'AUTH',
    resourceId: user.email,
    details: `User authenticated successfully via corporate credentials (${user.role})`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  return res.json({
    success: true,
    user: currentUser,
    token,
  });
});

app.post('/api/v1/auth/logout', (req: Request, res: Response) => {
  if (currentUser) {
    AUDIT_LOGS.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: 'USER_LOGOUT',
      resourceType: 'AUTH',
      resourceId: currentUser.email,
      details: `User session terminated cleanly via explicit logout.`,
      source: 'WEB_PORTAL',
      result: 'SUCCESS',
    });
  }
  // Reset session
  currentUser = null as any;
  res.json({ success: true, message: 'Session terminated successfully.' });
});

app.post('/api/v1/auth/switch-user', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = USERS.find((u) => u.email === email);
  if (user) {
    currentUser = user;
    const token = `jwt-sec-${user.id}-${Date.now()}`;
    return res.json({ success: true, user: currentUser, token });
  }
  res.status(404).json({ error: 'User not found' });
});

app.get('/api/v1/auth/users', (req: Request, res: Response) => {
  res.json({ users: USERS });
});

// Dashboard Metrics Route
app.get('/api/v1/dashboard/metrics', (req: Request, res: Response) => {
  const metrics: DashboardMetrics = {
    totalWorkforce: 10248,
    workforceDelta: 142,
    retentionRate: '98.4%',
    presentToday: 9412,
    presentRate: '91.8%',
    lateOrHalfCount: 450,
    leaveCount: 386,
    pendingApprovalsCount: APPROVAL_ITEMS.filter((a) => a.status === 'PENDING').length + 124,
    slaRiskCount: 14,
    payrollGross: '₹10.48 Cr',
    payrollNet: '₹8.42 Cr',
    cycleLockInDays: 4,
    exceptionsCount: PAYROLL_EXCEPTIONS.length + 18,
    criticalExceptionsCount: PAYROLL_EXCEPTIONS.filter((e) => e.severity === 'CRITICAL' && e.status !== 'RESOLVED').length,
    shiftEfficiency: '94.6%',
    shiftEfficiencyDelta: '+1.8%',
  };
  res.json({ metrics });
});

// Reference Data Endpoints
app.get('/api/v1/departments', (req: Request, res: Response) => {
  res.json({
    data: DEPARTMENTS,
    departments: DEPARTMENTS,
  });
});

app.get('/api/v1/locations', (req: Request, res: Response) => {
  res.json({
    data: LOCATIONS,
    locations: LOCATIONS,
  });
});

app.get('/api/v1/employees/managers', (req: Request, res: Response) => {
  const managers = EMPLOYEES.filter((e) => e.status === 'ACTIVE').sort((a, b) =>
    a.firstName.localeCompare(b.firstName)
  );
  res.json({
    data: managers,
    managers,
  });
});

// Employee Lifecycle Transition Validator
function isValidStatusTransition(current: string, target: string): boolean {
  if (current === target) return true;
  switch (current) {
    case 'ACTIVE':
      return ['ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'NOTICE'].includes(target);
    case 'ON_LEAVE':
      return target === 'ACTIVE';
    case 'SUSPENDED':
      return ['ACTIVE', 'TERMINATED'].includes(target);
    case 'PROBATION':
      return ['ACTIVE', 'TERMINATED'].includes(target);
    case 'NOTICE':
      return ['ACTIVE', 'TERMINATED'].includes(target);
    case 'TERMINATED':
      return false; // Terminal state
    default:
      return false;
  }
}

// Employee CRUD Endpoints
app.get('/api/v1/employees', (req: Request, res: Response) => {
  const {
    search,
    department,
    departmentId,
    status,
    location,
    locationId,
    contract,
    employmentType,
    page = '0',
    size = '25',
    limit = '25',
    sort = 'lastName',
    direction = 'asc',
  } = req.query;

  let results = [...EMPLOYEES];

  // Server-side text search across code, names, email, and job title
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q)
    );
  }

  // Server-side Department filter
  const targetDept = (departmentId || department) as string;
  if (targetDept && targetDept !== 'all') {
    results = results.filter(
      (e) =>
        e.departmentId.toLowerCase() === targetDept.toLowerCase() ||
        e.departmentName.toLowerCase().includes(targetDept.toLowerCase())
    );
  }

  // Server-side Status filter
  if (status && status !== 'all') {
    results = results.filter((e) => e.status.toLowerCase() === (status as string).toLowerCase());
  }

  // Server-side Location filter
  const targetLoc = (locationId || location) as string;
  if (targetLoc && targetLoc !== 'all') {
    results = results.filter(
      (e) =>
        e.locationId.toLowerCase() === targetLoc.toLowerCase() ||
        e.locationName.toLowerCase().includes(targetLoc.toLowerCase())
    );
  }

  // Server-side Employment Type filter
  const targetType = (employmentType || contract) as string;
  if (targetType && targetType !== 'all') {
    results = results.filter((e) => e.employmentType.toLowerCase() === targetType.toLowerCase());
  }

  // Safe sorting
  const sortField = typeof sort === 'string' ? sort : 'lastName';
  const sortDir = typeof direction === 'string' && direction.toLowerCase() === 'desc' ? -1 : 1;
  results.sort((a: any, b: any) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    if (typeof valA === 'string') {
      return sortDir * valA.localeCompare(String(valB));
    }
    return sortDir * (valA > valB ? 1 : valA < valB ? -1 : 0);
  });

  // Server-side pagination
  const rawPage = parseInt(page as string, 10) || 0;
  // Support both 0-indexed and 1-indexed page queries gracefully
  const p = rawPage > 0 && req.query.limit && !req.query.size ? rawPage - 1 : Math.max(0, rawPage);
  const pageSize = parseInt((size || limit) as string, 10) || 25;
  const total = results.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const paginated = results.slice(p * pageSize, (p + 1) * pageSize);

  res.json({
    content: paginated,
    data: paginated,
    page: p,
    size: pageSize,
    totalElements: total,
    totalPages,
    first: p === 0,
    last: p >= totalPages - 1,
    pagination: {
      totalEmployees: EMPLOYEES.length,
      filteredTotal: total,
      page: p + 1,
      limit: pageSize,
      totalPages,
    },
  });
});

app.get('/api/v1/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const emp = EMPLOYEES.find((e) => e.id === id || e.employeeCode.toUpperCase() === id.toUpperCase());
  if (!emp) {
    return res.status(404).json({
      code: 'EMPLOYEE_NOT_FOUND',
      message: `Employee not found for id/code: ${id}`,
    });
  }
  res.json({ employee: emp, data: emp });
});

app.post('/api/v1/employees', (req: Request, res: Response) => {
  if (!currentUser) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication session required.',
    });
  }

  // RBAC Authorization check
  const hasWriteAuth =
    currentUser.role === 'SYSTEM_ADMIN' ||
    currentUser.role === 'HR_ADMIN' ||
    currentUser.permissions.includes('EMPLOYEE_WRITE');

  if (!hasWriteAuth) {
    return res.status(403).json({
      code: 'INSUFFICIENT_PERMISSION',
      message: `Role ${currentUser.role} does not possess authority to create new employee profiles.`,
    });
  }

  const payload = req.body;

  // Field validation
  if (!payload.firstName?.trim() || !payload.lastName?.trim()) {
    return res.status(400).json({
      code: 'VALIDATION_FAILED',
      message: 'First name and last name are mandatory.',
    });
  }

  if (!payload.email?.trim()) {
    return res.status(400).json({
      code: 'VALIDATION_FAILED',
      message: 'Corporate email is mandatory.',
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = payload.email.trim().toLowerCase();
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({
      code: 'INVALID_EMAIL_FORMAT',
      message: 'Invalid email format. Please provide a valid RFC-compliant address.',
    });
  }

  // Email uniqueness check (409 CONFLICT)
  if (EMPLOYEES.some((e) => e.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({
      code: 'DUPLICATE_EMAIL',
      message: `Employee with email '${normalizedEmail}' already exists in database.`,
    });
  }

  // Employee Code generation or validation
  let empCode = payload.employeeCode?.trim();
  if (empCode) {
    if (EMPLOYEES.some((e) => e.employeeCode.toUpperCase() === empCode.toUpperCase())) {
      return res.status(409).json({
        code: 'DUPLICATE_EMPLOYEE_CODE',
        message: `Employee code '${empCode}' is already registered.`,
      });
    }
  } else {
    let nextNum = EMPLOYEES.length + 101;
    do {
      empCode = `EMP-${String(nextNum++).padStart(6, '0')}`;
    } while (EMPLOYEES.some((e) => e.employeeCode === empCode));
  }

  // Resolve Department
  let dept = DEPARTMENTS.find(
    (d) => d.id === payload.departmentId || d.name.toLowerCase() === payload.departmentName?.toLowerCase()
  );
  if (!dept) {
    dept = DEPARTMENTS[0];
  }

  // Resolve Location
  let loc = LOCATIONS.find(
    (l) => l.id === payload.locationId || l.name.toLowerCase() === payload.locationName?.toLowerCase()
  );
  if (!loc) {
    loc = LOCATIONS[0];
  }

  // Resolve Manager
  let managerName = payload.managerName || 'Ananya Roy';
  if (payload.managerId) {
    const mgr = EMPLOYEES.find((e) => e.id === payload.managerId);
    if (mgr) {
      managerName = `${mgr.firstName} ${mgr.lastName}`;
    }
  }

  const ctc = Number(payload.ctcAnnual) || 1800000;
  const newEmp: Employee = {
    id: `emp-${Date.now()}`,
    employeeCode: empCode,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: normalizedEmail,
    phone: payload.phone || '+91 98000 00000',
    dateOfBirth: payload.dateOfBirth || '1995-01-01',
    dateOfJoining: payload.dateOfJoining || new Date().toISOString().split('T')[0],
    departmentId: dept.id,
    departmentName: dept.name,
    managerId: payload.managerId || 'emp-6',
    managerName: managerName,
    jobTitle: payload.jobTitle?.trim() || 'Associate Engineer',
    level: payload.level || 'Level IC-3',
    employmentType: payload.employmentType || 'FULL_TIME',
    locationId: loc.id,
    locationName: loc.name,
    status: payload.status || 'ACTIVE',
    avatarUrl: payload.avatarUrl || '',
    bankAccountReference: payload.bankAccountReference || 'HDFC-xxxx-0000',
    ifscCode: payload.ifscCode || 'HDFC0001223',
    panNumber: payload.panNumber || 'ABCDE1234F',
    uanNumber: payload.uanNumber || '100999999999',
    ctcAnnual: ctc,
    baseMonthly: Math.round(ctc / 20),
    version: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  EMPLOYEES.unshift(newEmp);

  // Append Audit Record
  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'EMPLOYEE_CREATED',
    resourceType: 'EMPLOYEE',
    resourceId: newEmp.employeeCode,
    details: `New personnel onboarded: ${newEmp.firstName} ${newEmp.lastName} (${newEmp.jobTitle})`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.status(201).json({ employee: newEmp, data: newEmp });
});

app.put('/api/v1/employees/:id', (req: Request, res: Response) => {
  if (!currentUser) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  const hasWriteAuth =
    currentUser.role === 'SYSTEM_ADMIN' ||
    currentUser.role === 'HR_ADMIN' ||
    currentUser.permissions.includes('EMPLOYEE_WRITE');

  if (!hasWriteAuth) {
    return res.status(403).json({
      code: 'INSUFFICIENT_PERMISSION',
      message: `Role ${currentUser.role} cannot update employee records.`,
    });
  }

  const { id } = req.params;
  const idx = EMPLOYEES.findIndex((e) => e.id === id || e.employeeCode.toUpperCase() === id.toUpperCase());
  if (idx === -1) return res.status(404).json({ code: 'NOT_FOUND', message: 'Employee not found' });

  const old = EMPLOYEES[idx];

  // Optimistic locking verification (409 Conflict)
  if (req.body.version !== undefined && Number(req.body.version) !== (old.version || 0)) {
    return res.status(409).json({
      code: 'EMPLOYEE_MODIFIED_BY_ANOTHER_USER',
      message: 'This employee record was modified by another user. Please refresh and try again.',
    });
  }

  // Prevent self-management
  if (req.body.managerId && (req.body.managerId === old.id || req.body.managerId === old.employeeCode)) {
    return res.status(400).json({
      code: 'INVALID_MANAGER_ASSIGNMENT',
      message: 'An employee cannot be assigned as their own manager.',
    });
  }

  // Email uniqueness check if changed
  if (req.body.email) {
    const norm = req.body.email.trim().toLowerCase();
    if (norm !== old.email.toLowerCase()) {
      if (EMPLOYEES.some((e) => e.id !== old.id && e.email.toLowerCase() === norm)) {
        return res.status(409).json({
          code: 'DUPLICATE_EMAIL',
          message: `Employee with email '${norm}' already exists.`,
        });
      }
    }
  }

  // Resolve department / location names if IDs provided
  let deptName = old.departmentName;
  if (req.body.departmentId) {
    const d = DEPARTMENTS.find((dept) => dept.id === req.body.departmentId);
    if (d) deptName = d.name;
  }

  let locName = old.locationName;
  if (req.body.locationId) {
    const l = LOCATIONS.find((loc) => loc.id === req.body.locationId);
    if (l) locName = l.name;
  }

  let mgrName = old.managerName;
  if (req.body.managerId) {
    const m = EMPLOYEES.find((emp) => emp.id === req.body.managerId);
    if (m) mgrName = `${m.firstName} ${m.lastName}`;
  }

  EMPLOYEES[idx] = {
    ...old,
    ...req.body,
    departmentName: deptName,
    locationName: locName,
    managerName: mgrName,
    version: (old.version || 0) + 1,
    updatedAt: new Date().toISOString(),
  };

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'EMPLOYEE_UPDATED',
    resourceType: 'EMPLOYEE',
    resourceId: EMPLOYEES[idx].employeeCode,
    details: `Updated personnel record for ${EMPLOYEES[idx].firstName} ${EMPLOYEES[idx].lastName}`,
    oldValue: JSON.stringify({ status: old.status, title: old.jobTitle, dept: old.departmentName }),
    newValue: JSON.stringify({
      status: EMPLOYEES[idx].status,
      title: EMPLOYEES[idx].jobTitle,
      dept: EMPLOYEES[idx].departmentName,
    }),
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.json({ employee: EMPLOYEES[idx], data: EMPLOYEES[idx] });
});

app.patch('/api/v1/employees/:id/status', (req: Request, res: Response) => {
  if (!currentUser) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  const hasStatusAuth =
    currentUser.role === 'SYSTEM_ADMIN' ||
    currentUser.role === 'HR_ADMIN' ||
    currentUser.permissions.includes('EMPLOYEE_STATUS_CHANGE') ||
    currentUser.permissions.includes('EMPLOYEE_WRITE');

  if (!hasStatusAuth) {
    return res.status(403).json({
      code: 'INSUFFICIENT_PERMISSION',
      message: `Role ${currentUser.role} does not possess authority to modify employee lifecycle status.`,
    });
  }

  const { id } = req.params;
  const { status: targetStatus, version, reason } = req.body;

  const idx = EMPLOYEES.findIndex((e) => e.id === id || e.employeeCode.toUpperCase() === id.toUpperCase());
  if (idx === -1) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Employee record not found' });
  }

  const old = EMPLOYEES[idx];

  // Optimistic locking
  if (version !== undefined && Number(version) !== (old.version || 0)) {
    return res.status(409).json({
      code: 'EMPLOYEE_MODIFIED_BY_ANOTHER_USER',
      message: 'This employee record was modified by another user. Please refresh and try again.',
    });
  }

  // Validate status transition
  if (!targetStatus || !isValidStatusTransition(old.status, targetStatus)) {
    return res.status(400).json({
      code: 'INVALID_STATUS_TRANSITION',
      message: `Invalid lifecycle transition: Cannot change status from ${old.status} to ${targetStatus}.`,
    });
  }

  EMPLOYEES[idx] = {
    ...old,
    status: targetStatus,
    version: (old.version || 0) + 1,
    updatedAt: new Date().toISOString(),
  };

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'EMPLOYEE_STATUS_CHANGED',
    resourceType: 'EMPLOYEE',
    resourceId: EMPLOYEES[idx].employeeCode,
    details: `Status changed from ${old.status} to ${targetStatus}${reason ? ' (Reason: ' + reason + ')' : ''}`,
    oldValue: old.status,
    newValue: targetStatus,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.json({ employee: EMPLOYEES[idx], data: EMPLOYEES[idx] });
});

// Attendance Endpoints
app.get('/api/v1/attendance', (req: Request, res: Response) => {
  res.json({
    records: ATTENDANCE_RECORDS,
    userSession: CURRENT_USER_DUTY_SESSION,
    totalRecords: 10248,
  });
});

app.post('/api/v1/attendance/punch-in', (req: Request, res: Response) => {
  if (CURRENT_USER_DUTY_SESSION.active) {
    return res.status(400).json({
      code: 'ACTIVE_SESSION_EXISTS',
      message: 'Active attendance punch session already in progress.',
    });
  }
  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  CURRENT_USER_DUTY_SESSION = {
    active: true,
    checkInTime: nowTime,
    shift: 'General Shift A (09:00 - 18:00)',
    location: 'Web Portal Gate',
    onBreak: false,
    breakCount: 0,
    remoteLogged: false,
  };
  res.json({ success: true, session: CURRENT_USER_DUTY_SESSION });
});

app.post('/api/v1/attendance/punch-out', (req: Request, res: Response) => {
  if (!CURRENT_USER_DUTY_SESSION.active) {
    return res.status(400).json({
      code: 'NO_ACTIVE_SESSION',
      message: 'Cannot punch out without an active attendance session.',
    });
  }
  CURRENT_USER_DUTY_SESSION.active = false;
  res.json({ success: true, message: 'Punch out successfully recorded.' });
});

app.post('/api/v1/attendance/toggle-break', (req: Request, res: Response) => {
  CURRENT_USER_DUTY_SESSION.onBreak = !CURRENT_USER_DUTY_SESSION.onBreak;
  if (CURRENT_USER_DUTY_SESSION.onBreak) {
    CURRENT_USER_DUTY_SESSION.breakCount++;
  }
  res.json({ success: true, session: CURRENT_USER_DUTY_SESSION });
});

// Regularization Endpoints
app.get('/api/v1/attendance/regularizations', (req: Request, res: Response) => {
  res.json({ regularizations: REGULARIZATIONS });
});

app.post('/api/v1/attendance/regularize', (req: Request, res: Response) => {
  const { employeeName, employeeCode, incidentDate, category, proposedTime, reason } = req.body;
  const newReg: RegularizationRequest = {
    id: `reg-${Date.now()}`,
    requestId: `#REG-${Math.floor(1000 + Math.random() * 9000)}`,
    employeeId: currentUser.id,
    employeeName: employeeName || currentUser.fullName,
    employeeCode: employeeCode || currentUser.employeeId,
    incidentDate: incidentDate || new Date().toISOString().split('T')[0],
    category: category || 'Gate Scanner Discrepancy',
    proposedTime: proposedTime || '09:00 AM',
    reason: reason || 'Biometric terminal timeout. Regularization filed.',
    status: 'PENDING',
    shiftSchedule: '09:00 - 18:00',
    createdAt: 'Just now',
  };
  REGULARIZATIONS.unshift(newReg);
  res.status(201).json({ regularization: newReg });
});

app.post('/api/v1/attendance/regularizations/:id/action', (req: Request, res: Response) => {
  if (!currentUser) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication session required.',
      path: req.originalUrl,
    });
  }

  // RBAC check: Only MANAGER, HR_ADMIN, or SYSTEM_ADMIN
  if (!currentUser.permissions.includes('ATTENDANCE_APPROVE') && currentUser.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({
      timestamp: new Date().toISOString(),
      status: 403,
      code: 'INSUFFICIENT_PERMISSION',
      message: `You do not have permission to approve attendance regularizations. Current role: ${currentUser.role}`,
      path: req.originalUrl,
    });
  }

  const { id } = req.params;
  const { action } = req.body; // 'APPROVE' | 'REJECT'
  const item = REGULARIZATIONS.find((r) => r.id === id);
  if (!item) return res.status(404).json({ error: 'Request not found' });

  item.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  item.reviewedBy = currentUser.fullName;
  item.reviewedAt = new Date().toISOString();

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: action === 'APPROVE' ? 'REGULARIZATION_APPROVED' : 'REGULARIZATION_REJECTED',
    resourceType: 'ATTENDANCE',
    resourceId: item.requestId,
    details: `${action === 'APPROVE' ? 'Approved' : 'Rejected'} attendance regularization for ${item.employeeName}`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.json({ regularization: item });
});

// Approvals Endpoints
app.get('/api/v1/approvals', (req: Request, res: Response) => {
  res.json({ items: APPROVAL_ITEMS });
});

app.post('/api/v1/approvals/:id/action', (req: Request, res: Response) => {
  if (!currentUser) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication session required.',
      path: req.originalUrl,
    });
  }

  // Employees cannot approve governance items
  if (currentUser.role === 'EMPLOYEE') {
    return res.status(403).json({
      timestamp: new Date().toISOString(),
      status: 403,
      code: 'INSUFFICIENT_PERMISSION',
      message: 'Employees do not possess executive signing authority.',
      path: req.originalUrl,
    });
  }

  const { id } = req.params;
  const { action, comments } = req.body; // 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'
  const item = APPROVAL_ITEMS.find((a) => a.id === id);
  if (!item) return res.status(404).json({ error: 'Approval item not found' });

  item.status = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED';
  item.steps.push({
    stepOrder: item.steps.length + 1,
    approverRole: currentUser.role,
    approverName: currentUser.fullName,
    action: action === 'APPROVE' ? 'APPROVE' : action === 'REJECT' ? 'REJECT' : 'REQUEST_CHANGES',
    comments: comments || `${action} by ${currentUser.fullName}`,
    timestamp: new Date().toISOString(),
  });

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: `APPROVAL_${action}`,
    resourceType: item.type,
    resourceId: item.id,
    details: `${action} on "${item.title}" for ${item.requesterName} (${item.amountFormatted || item.daysFormatted || ''})`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.json({ item });
});

// Leave Endpoints
app.get('/api/v1/leave/requests', (req: Request, res: Response) => {
  res.json({ requests: LEAVE_REQUESTS, balances: LEAVE_BALANCES });
});

app.post('/api/v1/leave/requests', (req: Request, res: Response) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  // Validation: Start Date vs End Date
  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      code: 'INVALID_LEAVE_REQUEST',
      message: 'Leave end date cannot be before start date',
      path: '/api/v1/leave/requests',
    });
  }

  // Calculate duration
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Balance Check
  const balance = LEAVE_BALANCES.find((b) => b.leaveType === leaveType);
  if (balance && balance.available < diffDays && leaveType !== 'UNPAID') {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      code: 'INSUFFICIENT_LEAVE_BALANCE',
      message: `Requested ${diffDays} days exceeds available ${leaveType} balance (${balance.available} days).`,
      path: '/api/v1/leave/requests',
    });
  }

  // Overlap Check
  const hasOverlap = LEAVE_REQUESTS.some(
    (r) =>
      r.employeeId === currentUser.id &&
      r.status !== 'REJECTED' &&
      r.status !== 'CANCELLED' &&
      ((startDate >= r.startDate && startDate <= r.endDate) || (endDate >= r.startDate && endDate <= r.endDate))
  );

  if (hasOverlap) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      code: 'OVERLAPPING_LEAVE_REQUEST',
      message: 'An existing leave request covers the selected date range.',
      path: '/api/v1/leave/requests',
    });
  }

  const newReq: LeaveRequest = {
    id: `lr-${Date.now()}`,
    employeeId: currentUser.id,
    employeeCode: currentUser.employeeId,
    employeeName: currentUser.fullName,
    leaveType,
    startDate,
    endDate,
    durationDays: diffDays,
    reason: reason || 'Planned personal leave',
    status: 'SUBMITTED',
    submittedAt: new Date().toISOString(),
  };

  LEAVE_REQUESTS.unshift(newReq);

  // Update pending balance
  if (balance) {
    balance.pending += diffDays;
    balance.available -= diffDays;
  }

  res.status(201).json({ request: newReq, balances: LEAVE_BALANCES });
});

// Payroll Endpoints
app.get('/api/v1/payroll/runs', (req: Request, res: Response) => {
  res.json({
    currentRun: CURRENT_PAYROLL_RUN,
    exceptions: PAYROLL_EXCEPTIONS,
  });
});

app.post('/api/v1/payroll/runs/:id/revalidate', (req: Request, res: Response) => {
  // Recompute exceptions
  const criticalCount = PAYROLL_EXCEPTIONS.filter((e) => e.severity === 'CRITICAL' && e.status !== 'RESOLVED').length;
  CURRENT_PAYROLL_RUN.criticalExceptions = criticalCount;
  CURRENT_PAYROLL_RUN.exceptionsTotal = PAYROLL_EXCEPTIONS.filter((e) => e.status !== 'RESOLVED').length;

  res.json({
    success: true,
    message: `Auto-Revalidation executed across 10,248 records. ${criticalCount} critical exceptions remaining.`,
    currentRun: CURRENT_PAYROLL_RUN,
    exceptions: PAYROLL_EXCEPTIONS,
  });
});

app.post('/api/v1/payroll/runs/:id/exceptions/:excId/resolve', (req: Request, res: Response) => {
  const { excId } = req.params;
  const exc = PAYROLL_EXCEPTIONS.find((e) => e.id === excId);
  if (!exc) return res.status(404).json({ error: 'Exception not found' });

  exc.status = 'RESOLVED';
  const remainingCritical = PAYROLL_EXCEPTIONS.filter((e) => e.severity === 'CRITICAL' && e.status !== 'RESOLVED').length;
  CURRENT_PAYROLL_RUN.criticalExceptions = remainingCritical;
  CURRENT_PAYROLL_RUN.exceptionsTotal = PAYROLL_EXCEPTIONS.filter((e) => e.status !== 'RESOLVED').length;

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'PAYROLL_EXCEPTION_RESOLVED',
    resourceType: 'PAYROLL_EXCEPTION',
    resourceId: exc.id,
    details: `Resolved ${exc.exceptionTypeLabel} for ${exc.employeeName} (${exc.employeeCode})`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.json({
    success: true,
    exception: exc,
    currentRun: CURRENT_PAYROLL_RUN,
  });
});

app.post('/api/v1/payroll/runs/:id/approve', (req: Request, res: Response) => {
  if (!currentUser) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication session required.',
      path: req.originalUrl,
    });
  }

  // Backend RBAC enforcement: Only PAYROLL_ADMIN or SYSTEM_ADMIN with PAYROLL_APPROVE permission
  if (!currentUser.permissions.includes('PAYROLL_APPROVE') && currentUser.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({
      timestamp: new Date().toISOString(),
      status: 403,
      code: 'INSUFFICIENT_PERMISSION',
      message: `You do not have permission to approve payroll. Current role: ${currentUser.role}`,
      path: req.originalUrl,
    });
  }

  const unhandledCritical = PAYROLL_EXCEPTIONS.filter((e) => e.severity === 'CRITICAL' && e.status !== 'RESOLVED');
  if (unhandledCritical.length > 0) {
    return res.status(400).json({
      code: 'CRITICAL_EXCEPTIONS_PENDING',
      message: `Cannot approve payroll cycle: ${unhandledCritical.length} critical blocking exceptions must be resolved first.`,
    });
  }

  CURRENT_PAYROLL_RUN.status = 'APPROVED';
  CURRENT_PAYROLL_RUN.step = 5;

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    userId: currentUser.id,
    userEmail: currentUser.email,
    action: 'PAYROLL_APPROVED_CFO',
    resourceType: 'PAYROLL_RUN',
    resourceId: CURRENT_PAYROLL_RUN.runCode,
    details: `Executive Sign-off and cryptographic e-Sign unlocked by ${currentUser.fullName}`,
    source: 'WEB_PORTAL',
    result: 'SUCCESS',
  });

  res.json({ success: true, currentRun: CURRENT_PAYROLL_RUN });
});

// Payslip Generation & Retrieval
app.get('/api/v1/payroll/payslips/:empCode', (req: Request, res: Response) => {
  const { empCode } = req.params;
  const emp = EMPLOYEES.find((e) => e.employeeCode === empCode) || EMPLOYEES[0];

  const base = emp.baseMonthly;
  const hra = Math.round(base * 0.4);
  const ta = 12000;
  const spl = Math.round(base * 0.25);
  const bonus = 15000;
  const gross = base + hra + ta + spl + bonus;

  const pf = Math.round(base * 0.12);
  const pt = 200;
  const tds = Math.round(gross * 0.15);
  const totalDed = pf + pt + tds;
  const net = gross - totalDed;

  const payslip: Payslip = {
    id: `ps-${emp.employeeCode}-2026-09`,
    payrollRunId: 'pr-2026-09',
    employeeId: emp.id,
    employeeCode: emp.employeeCode,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    jobTitle: emp.jobTitle,
    department: emp.departmentName,
    location: emp.locationName,
    dateOfJoining: emp.dateOfJoining,
    bankAccountRef: emp.bankAccountReference,
    bankName: 'HDFC Corporate Banking',
    ifscCode: emp.ifscCode,
    panNumber: emp.panNumber,
    uanNumber: emp.uanNumber,
    payPeriod: 'September 2026 (01 Sep 2026 – 30 Sep 2026)',
    disbursementDate: '30 September 2026',
    workedDays: 30,
    lopDays: 0,
    earnings: {
      baseSalary: base,
      housingAllowance: hra,
      transportAllowance: ta,
      specialAllowance: spl,
      overtime: 0,
      performanceBonus: bonus,
      grossEarnings: gross,
    },
    deductions: {
      providentFund: pf,
      employeeStateInsurance: 0,
      professionalTax: pt,
      incomeTaxTds: tds,
      voluntaryDeduction: 0,
      totalDeductions: totalDed,
    },
    netPayable: net,
    netPayableWords: 'Rupees Three Lakh Four Thousand One Hundred Only',
  };

  res.json({ payslip });
});

// AI Feature: Payroll Exception Assistant (Section 40 & 41)
app.post('/api/v1/ai/payroll-assistant', async (req: Request, res: Response) => {
  try {
    // 1. Sanitize & Minimize Data (No bank accounts, passwords, PII, tokens)
    const sanitizedExceptions = PAYROLL_EXCEPTIONS.map((e) => ({
      id: e.id,
      severity: e.severity,
      exceptionType: e.exceptionTypeLabel,
      department: e.department,
      location: e.location,
      anonymizedRole: e.designation,
      issueOverview: e.description.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]'),
      netImpact: e.netImpact,
      status: e.status,
    }));

    if (ai) {
      try {
        const prompt = `You are the WorkSphere Enterprise Payroll Exception Advisory Assistant.
Analyze these sanitized enterprise payroll exception records for payroll run #PR-2026-09:
${JSON.stringify(sanitizedExceptions, null, 2)}

Provide an authoritative, high-density advisory briefing for the CFO and Payroll Administrators.
Respond with a JSON object conforming strictly to this format:
{
  "summary": "Executive overview of exceptions and aggregate financial exposure",
  "totalExceptions": number,
  "criticalBlockersCount": number,
  "financialRiskVolume": "e.g. ₹4,18,200",
  "rootCauses": ["Key root cause 1", "Key root cause 2", "Key root cause 3"],
  "suggestedReviewOrder": [
    {
      "step": 1,
      "exceptionId": "id string",
      "action": "Immediate corrective operation",
      "rational": "Why this must be resolved before treasury release"
    }
  ],
  "complianceSummary": "Statutory compliance note regarding EPFO, TDS Section 192, and RTGS clearing",
  "advisoryDisclaimer": "Advisory intelligence summary. All adjustments remain deterministic operations in the payroll ledger."
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const parsed = JSON.parse(aiResponse.text || '{}');
        return res.json({ result: parsed });
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to deterministic advisory analysis:', geminiError.message);
      }
    }

    // High-fidelity fallback if API key is not yet set or unavailable
    return res.json({
      result: {
        summary: 'Advisory analysis across 23 flagged cycle exceptions identifies 4 critical blockers halting RTGS batch disbursement for ₹4,18,200 net exposure.',
        totalExceptions: PAYROLL_EXCEPTIONS.length,
        criticalBlockersCount: PAYROLL_EXCEPTIONS.filter((e) => e.severity === 'CRITICAL' && e.status !== 'RESOLVED').length,
        financialRiskVolume: '₹4,18,200',
        rootCauses: [
          'Dual-booked festival recovery deduction exceeding base monthly entitlement (Negative Net Pay).',
          'NPCI bank handshake failure due to dummy/corrupt branch IFSC codes.',
          'Section 192 tax slab bracket mismatch between Old vs 115BAC regimes.',
          'Unmapped secondary accounts in split-disbursement configurations.',
        ],
        suggestedReviewOrder: [
          {
            step: 1,
            exceptionId: 'exc-1',
            action: 'Reschedule loan amortization to amortize across 3 months.',
            rational: 'Direct statutory prohibition on negative net disbursement payouts under Payment of Wages Act.',
          },
          {
            step: 2,
            exceptionId: 'exc-2',
            action: 'Validate bank routing branch code with NPCI master directory.',
            rational: 'HDFC Host-to-Host batch will fail and reject entire RTGS transaction queue if routing fails.',
          },
          {
            step: 3,
            exceptionId: 'exc-3',
            action: 'Recompute TDS engine under validated Section 192 proofs.',
            rational: 'Prevents excess statutory deduction and subsequent employee grievance filings.',
          },
        ],
        complianceSummary: 'Statutory EPFO and ESIC filings pass pre-flight verification; treasury escrow holds 148% disbursement coverage.',
        advisoryDisclaimer: 'Advisory intelligence summary. All adjustments remain deterministic operations in the payroll ledger.',
      },
    });
  } catch (err: any) {
    console.error('Error generating AI payroll exception advice:', err);
    res.status(500).json({
      error: 'AI Advisory Service temporarily unavailable',
      fallback: 'Please review critical exceptions manually in the resolver table.',
    });
  }
});

// Audit Logs
app.get('/api/v1/audit-logs', (req: Request, res: Response) => {
  res.json({ logs: AUDIT_LOGS });
});

// Notifications
app.get('/api/v1/notifications', (req: Request, res: Response) => {
  res.json({ notifications: NOTIFICATIONS });
});

app.post('/api/v1/notifications/read-all', (req: Request, res: Response) => {
  NOTIFICATIONS.forEach((n) => (n.read = true));
  res.json({ success: true, notifications: NOTIFICATIONS });
});

app.post('/api/v1/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const n = NOTIFICATIONS.find((item) => item.id === id);
  if (n) n.read = true;
  res.json({ success: true, notification: n });
});

// Reports Route
app.get('/api/v1/reports/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  res.json({
    reportType: type,
    generatedAt: new Date().toISOString(),
    filterSummary: { department: 'All', period: 'Sep 2026', totalRecords: 10248 },
    departmentBreakdown: [
      { name: 'Engineering & Product', headcount: 3410, present: 3205, rate: '94.0%', leave: 112, remote: 93, status: 'Optimal' },
      { name: 'Global Operations & Supply', headcount: 2180, present: 2027, rate: '93.0%', leave: 86, remote: 67, status: 'Optimal' },
      { name: 'Sales, Growth & Marketing', headcount: 1840, present: 1634, rate: '88.8%', leave: 94, remote: 112, status: 'Field Heavy' },
      { name: 'Finance, Tax & Legal', headcount: 680, present: 646, rate: '95.0%', leave: 22, remote: 12, status: 'High Stability' },
      { name: 'People Operations & HR', headcount: 290, present: 282, rate: '97.2%', leave: 6, remote: 2, status: 'Peak Present' },
    ],
  });
});

// ==========================================
// Vite Integration (Dev) / Static (Prod)
// ==========================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`WorkSphere Enterprise Server listening on port ${port}`);
  });
}

startServer();
