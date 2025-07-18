# Test Data

This folder contains sample data files for testing the Resume Position Matcher application.

## Files

### sample_positions.csv
A CSV file containing 15 sample job positions with the following columns:
- **Job Title** - The position title
- **Company** - Company name
- **Department** - Department within the company
- **Location** - Job location
- **Job Description** - Detailed description of the role
- **Required Skills** - Technical and soft skills required
- **Experience Level** - Junior, Mid-level, or Senior
- **Salary Range** - Salary range for the position
- **Employment Type** - Full-time, Part-time, Contract, etc.

## Usage

1. Upload `sample_positions.csv` when creating a new project
2. For embedding generation, consider selecting columns like:
   - Job Title
   - Job Description
   - Required Skills
   - Experience Level
3. For output results, you might want to include:
   - Job Title
   - Company
   - Location
   - Salary Range
   - Employment Type

## Creating Your Own Test Data

To create your own position data:
1. Use the same column structure as the sample file
2. Save as CSV or Excel format
3. Ensure job descriptions and required skills are detailed for better matching accuracy

## Sample Resume PDFs

You can create sample PDF resumes or use existing ones to test the matching functionality. The application will extract text from PDFs and match them against the position data using AI embeddings.