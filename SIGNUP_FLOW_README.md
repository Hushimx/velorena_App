# Signup Flow Implementation

This document describes the new signup flow screens that have been implemented based on the provided design images.

## Overview

The signup flow consists of three main screens:
1. **Main Signup Screen** (`app/signup.tsx`) - Type selection (Company vs Individual)
2. **Company Signup Step 1** (`app/signup/company-step1.tsx`) - Basic company information
3. **Company Signup Step 2** (`app/signup/company-step2.tsx`) - Company documents and details
4. **Individual Signup** (`app/signup/individual.tsx`) - Individual registration form

## Features

### Company Signup Flow

#### Step 1 - Basic Information
- Company Name (اسم الشركة)
- Mobile Number with Country Picker (رقم الجوال)
- Email (البريد الالكتروني)
- Password (كلمة المرور)
- Confirm Password (تأكيد كلمة المرور)
- Address (العنوان)
- Logo Upload (شعار - اختياري)

#### Step 2 - Company Details
- Activity Description (وصف مختصر للنشاط)
- Commercial Register (السجل التجاري) - Number + File Upload
- Tax Register (السجل الضريبي) - Number + File Upload (Optional)
- Responsible Person Name (اسم المسؤول / الممثل القانوني)
- Job Title (المسمى الوظيفي للمسؤول - اختياري)
- Terms and Conditions Agreement
- Create Account Button

### Individual Signup Flow

- Name (الاسم)
- Mobile Number with Country Picker (رقم الجوال)
- Email (البريد الالكتروني)
- Password (كلمة المرور)
- Confirm Password (تأكيد كلمة المرور)
- Address (العنوان)
- Logo Upload (شعار - اختياري)
- Date of Birth (تاريخ الميلاد)
- Freelance Document (وثيقة عمل حر - اختياري)
- Terms and Conditions Agreement
- Create Account Button

## Technical Implementation

### Dependencies Added
- `react-native-country-picker-modal` - For country selection in phone number inputs
- `expo-document-picker` - For file uploads (PDF, JPG, PNG)

### Key Features
- **RTL Support**: All text and inputs are right-to-left aligned for Arabic
- **Form Validation**: Basic validation for required fields
- **File Uploads**: Support for document and image uploads
- **Country Picker**: Integrated country selection for phone numbers
- **Consistent Styling**: Uses the existing TEAL_600 color scheme
- **Navigation**: Expo Router navigation between screens

### File Structure
```
app/
├── signup.tsx                    # Main signup screen with type selection
└── signup/
    ├── company-step1.tsx        # Company signup first step
    ├── company-step2.tsx        # Company signup second step
    └── individual.tsx           # Individual signup screen
```

## Usage

1. Navigate to `/signup` to access the main signup screen
2. Select either "تسجيل كشركة" (Company) or "تسجيل كفرد" (Individual)
3. Fill out the respective form with the required information
4. For company signup, complete both steps
5. Submit the form to create the account

## Styling

- **Header**: Teal background with white text and back button
- **Form Container**: White sheet with rounded top corners
- **Input Fields**: Teal borders with icons and RTL text alignment
- **Buttons**: Teal background with white text
- **File Upload**: Dashed border upload buttons
- **Country Picker**: Integrated within phone number input

## Future Enhancements

- Date picker for date of birth
- Enhanced file upload with preview
- Form data persistence between navigation
- Advanced validation rules
- Integration with backend API
- Loading states and error handling
