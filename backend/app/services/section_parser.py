"""
Raw Section-Based Resume Parser with Fuzzy Matching
Parses resumes by looking for uppercase section titles and using fuzzy matching
"""
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from fuzzywuzzy import fuzz
import logging

logger = logging.getLogger(__name__)


class RawSectionParser:
    """Raw parser that uses fuzzy matching on uppercase section titles"""

    def __init__(self):
        self.logger = logger

        # Load filter strings from file
        self.filter_strings = self._load_filter_strings()

        # Define the 7 target sections we're looking for
        self.target_sections = {
            'summary': ['SUMMARY', 'PROFESSIONAL SUMMARY', 'PROFILE', 'OVERVIEW', 'OBJECTIVE', 'CAREER OBJECTIVE'],
            'specialization': ['SPECIALIZATION', 'EXPERTISE', 'CORE COMPETENCIES', 'AREA OF EXPERTISE', 'SPECIALIZATION AREA'],
            'skills': ['SKILLS', 'TECHNICAL SKILLS', 'CORE SKILLS', 'COMPETENCIES', 'TECHNOLOGIES'],
            'current_project': ['CURRENT PROJECT', 'CURRENT ASSIGNMENT', 'CURRENT ROLE', 'PRESENT POSITION', 'CURRENT WORK'],
            'prior_experience': ['EXPERIENCE', 'WORK EXPERIENCE', 'EMPLOYMENT HISTORY', 'PROFESSIONAL EXPERIENCE', 'CAREER HISTORY', 'WORK HISTORY'],
            'education': ['EDUCATION', 'EDUCATIONAL BACKGROUND', 'ACADEMIC BACKGROUND', 'ACADEMIC QUALIFICATIONS', 'QUALIFICATIONS'],
            'certifications': ['CERTIFICATIONS', 'CERTIFICATES', 'PROFESSIONAL CERTIFICATIONS', 'LICENSES', 'CREDENTIALS']
        }

        # Skills that should be exact matches (1:1)
        self.exact_skills = [
            # Programming Languages
            'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
            'Scala', 'R', 'MATLAB', 'SQL', 'HTML', 'CSS', 'Bash', 'PowerShell', 'Perl', 'Lua', 'Dart', 'F#',

            # Frameworks & Libraries
            'React', 'Angular', 'Vue.js', 'Django', 'Flask', 'Spring', 'Express.js', 'Node.js', 'Laravel', 'Rails',
            'ASP.NET', 'jQuery', 'Bootstrap', 'Tailwind', 'Material-UI', 'Vuetify', 'Redux', 'MobX', 'RxJS',

            # Databases
            'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'SQLite', 'Oracle', 'SQL Server', 'DynamoDB',
            'Elasticsearch', 'Neo4j', 'InfluxDB', 'CouchDB', 'MariaDB',

            # Cloud Platforms
            'AWS', 'Azure', 'GCP', 'Google Cloud', 'Heroku', 'DigitalOcean', 'Linode', 'Vercel', 'Netlify',

            # DevOps & Tools
            'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Terraform', 'Ansible', 'Chef', 'Puppet',
            'Vagrant', 'Helm', 'Istio', 'Prometheus', 'Grafana', 'ELK Stack', 'Nginx', 'Apache', 'HAProxy',

            # Operating Systems
            'Linux', 'Ubuntu', 'CentOS', 'RHEL', 'Windows', 'macOS', 'Unix', 'Debian', 'Fedora', 'SUSE',

            # Development Tools
            'Git', 'SVN', 'Mercurial', 'JIRA', 'Confluence', 'Slack', 'Teams', 'Trello', 'Asana', 'Notion',
            'VS Code', 'IntelliJ', 'Eclipse', 'Vim', 'Emacs', 'Sublime Text', 'Atom',

            # Testing
            'Jest', 'Mocha', 'Cypress', 'Selenium', 'JUnit', 'PyTest', 'TestNG', 'Cucumber', 'Postman', 'Insomnia',

            # Data Science & ML
            'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Plotly',
            'Jupyter', 'Apache Spark', 'Hadoop', 'Kafka', 'Airflow', 'MLflow', 'Kubeflow',

            # Mobile Development
            'React Native', 'Flutter', 'Xamarin', 'Ionic', 'Cordova', 'Android Studio', 'Xcode',

            # Design & Frontend
            'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'InVision', 'Zeplin', 'Framer',

            # Project Management
            'Agile', 'Scrum', 'Kanban', 'Waterfall', 'SAFe', 'Lean', 'Six Sigma',

            # Security
            'OWASP', 'Penetration Testing', 'Vulnerability Assessment', 'SIEM', 'IDS', 'IPS', 'Firewall',
            'OAuth', 'SAML', 'JWT', 'SSL/TLS', 'PKI'
        ]

    def parse_resume(self, text: str, filename: str = "", return_raw_sections: bool = False) -> Dict[str, Any]:
        """Parse resume using raw section-based approach with fuzzy matching"""
        try:
            self.logger.info(f"Using raw section parser for {filename}")

            # Find all potential sections with their positions
            sections = self._find_sections(text)

            # Extract content for each target section
            extracted_data = {}
            for target_section in self.target_sections.keys():
                extracted_data[target_section] = self._extract_section_content(text, sections, target_section, filename)

            if return_raw_sections:
                # Return raw section content without processing but with name removal
                # Apply name removal to each section
                cleaned_sections = {}
                for section_key, section_content in extracted_data.items():
                    if section_content:
                        # Apply filter strings removal
                        cleaned_content = self._remove_filter_strings(section_content)
                        # Apply name removal
                        cleaned_content = self._remove_person_name_from_content(cleaned_content, filename)
                        cleaned_sections[section_key] = cleaned_content or ''
                    else:
                        cleaned_sections[section_key] = ''

                parsed_data = {
                    'metadata': {
                        'filename': filename,
                        'processed_at': datetime.now().isoformat(),
                        'parsing_method': 'raw_section_content'
                    },
                    'raw_sections': {
                        'summary': cleaned_sections['summary'],
                        'specialization': cleaned_sections['specialization'],
                        'skills': cleaned_sections['skills'],
                        'current_project': cleaned_sections['current_project'],
                        'prior_experience': cleaned_sections['prior_experience'],
                        'education': cleaned_sections['education'],
                        'certifications': cleaned_sections['certifications']
                    },
                    'detected_sections': self._get_section_info(sections)
                }
            else:
                # Process sections into structured data (original behavior)
                # Process skills with exact matching
                if extracted_data['skills']:
                    extracted_data['skills'] = self._extract_exact_skills(extracted_data['skills'])
                else:
                    extracted_data['skills'] = []

                # Process experience sections
                if extracted_data['prior_experience']:
                    extracted_data['prior_experience'] = self._parse_experience_entries(extracted_data['prior_experience'])
                else:
                    extracted_data['prior_experience'] = []

                # Process education section
                if extracted_data['education']:
                    extracted_data['education'] = self._parse_education_entries(extracted_data['education'])
                else:
                    extracted_data['education'] = []

                # Process certifications
                if extracted_data['certifications']:
                    extracted_data['certifications'] = self._parse_certification_entries(extracted_data['certifications'])
                else:
                    extracted_data['certifications'] = []

                # Create the simplified 7-section format
                parsed_data = {
                    'metadata': {
                        'filename': filename,
                        'processed_at': datetime.now().isoformat(),
                        'parsing_method': 'raw_section_fuzzy'
                    },
                    'resume_data': {
                        'summary': extracted_data['summary'] or '',
                        'specialization': extracted_data['specialization'] or '',
                        'skills': extracted_data['skills'],
                        'current_project': extracted_data['current_project'] or '',
                        'prior_experience': extracted_data['prior_experience'],
                        'education': extracted_data['education'],
                        'certifications': extracted_data['certifications']
                    }
                }

            self.logger.info(f"Raw section parsing completed for {filename}")
            return parsed_data

        except Exception as e:
            self.logger.error(f"Error in raw section parsing: {e}")
            return {
                'error': str(e),
                'filename': filename,
                'metadata': {
                    'filename': filename,
                    'processed_at': datetime.now().isoformat(),
                    'parsing_method': 'raw_section_failed'
                }
            }

    def _find_sections(self, text: str) -> List[Tuple[str, int, str]]:
        """Find all potential section headers in the text"""
        sections = []

        # Look for uppercase text that could be section headers
        # Pattern: Line that starts with UPPERCASE words, possibly with spaces/punctuation
        section_pattern = r'^[A-Z][A-Z\s&/\-:()]{2,50}$'

        lines = text.split('\n')
        for i, line in enumerate(lines):
            line = line.strip()
            if len(line) >= 3 and re.match(section_pattern, line):
                # Find the position in the original text
                pos = text.find(line, sum(len(lines[j]) + 1 for j in range(i)))
                sections.append((line, pos, 'potential_header'))

        # Also look for common patterns like "Section:" or "SECTION -"
        colon_pattern = r'^([A-Z][A-Z\s&/\-()]{2,30})[:\-]'
        for i, line in enumerate(lines):
            line = line.strip()
            match = re.match(colon_pattern, line)
            if match:
                header = match.group(1).strip()
                pos = text.find(line, sum(len(lines[j]) + 1 for j in range(i)))
                sections.append((header, pos, 'header_with_delimiter'))

        # Sort by position in text
        sections.sort(key=lambda x: x[1])

        self.logger.info(f"Found {len(sections)} potential section headers")
        return sections

    def _get_section_info(self, sections: List[Tuple[str, int, str]]) -> List[Dict[str, Any]]:
        """Get information about all detected sections"""
        section_info = []
        for section_header, position, header_type in sections:
            section_info.append({
                'header': section_header,
                'position': position,
                'type': header_type,
                'matched_to': self._find_target_match(section_header)
            })
        return section_info

    def _find_target_match(self, section_header: str) -> Optional[str]:
        """Find which target section this header matches to"""
        best_match = None
        best_score = 0

        for target_section, target_headers in self.target_sections.items():
            for target_header in target_headers:
                score = fuzz.ratio(section_header.upper(), target_header.upper())
                threshold = 90 if target_section == 'skills' else 70

                if score >= threshold and score > best_score:
                    best_match = target_section
                    best_score = score

        return best_match

    def _extract_section_content(self, text: str, sections: List[Tuple[str, int, str]], target_section: str, filename: str = "") -> Optional[str]:
        """Extract content for a specific target section using fuzzy matching"""
        target_headers = self.target_sections[target_section]

        best_match = None
        best_score = 0
        best_position = -1

        # Find the best matching section header using fuzzy matching
        for section_header, position, header_type in sections:
            for target_header in target_headers:
                # Use fuzzy matching to find similar headers
                score = fuzz.ratio(section_header.upper(), target_header.upper())

                # For skills, require exact match or very high similarity
                if target_section == 'skills':
                    if score >= 90:  # Very high threshold for skills
                        if score > best_score:
                            best_match = section_header
                            best_score = score
                            best_position = position
                else:
                    # For other sections, use lower threshold
                    if score >= 70:  # Lower threshold for other sections
                        if score > best_score:
                            best_match = section_header
                            best_score = score
                            best_position = position

        if best_match:
            self.logger.info(f"Matched '{target_section}' to '{best_match}' (score: {best_score})")

            # Find the next section to determine content boundaries
            next_position = len(text)
            for _, pos, _ in sections:
                if pos > best_position:
                    next_position = pos
                    break

            # Extract content between this section and the next
            section_start = best_position + len(best_match)
            section_content = text[section_start:next_position].strip()

            # Clean up the content
            section_content = self._clean_section_content(section_content)

            # Apply filter strings removal
            section_content = self._remove_filter_strings(section_content)

            # Remove person's name from content if filename contains name
            section_content = self._remove_person_name_from_content(section_content, filename)

            return section_content if section_content else None

        self.logger.warning(f"No match found for section: {target_section}")
        return None

    def _clean_section_content(self, content: str) -> str:
        """Clean up section content"""
        if not content:
            return ""

        # Remove leading/trailing whitespace
        content = content.strip()

        # Remove excessive newlines
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

        # Remove lines that are just dashes or equals signs
        lines = content.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if line and not re.match(r'^[-=_]+$', line):
                cleaned_lines.append(line)

        return '\n'.join(cleaned_lines)

    def _load_filter_strings(self) -> List[str]:
        """Load filter strings from file"""
        filter_strings = []

        # Look for filter_strings.txt in the project root
        project_root = Path(__file__).parent.parent.parent.parent
        filter_file = project_root / "filter_strings.txt"

        try:
            if filter_file.exists():
                with open(filter_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        # Skip empty lines and comments
                        if line and not line.startswith('#'):
                            filter_strings.append(line)

                self.logger.info(f"Loaded {len(filter_strings)} filter strings from {filter_file}")
            else:
                self.logger.warning(f"Filter strings file not found: {filter_file}")

        except Exception as e:
            self.logger.error(f"Error loading filter strings: {e}")

        return filter_strings

    def _remove_filter_strings(self, content: str) -> str:
        """Remove filter strings from content using fuzzy matching"""
        if not content or not self.filter_strings:
            return content

        lines = content.split('\n')
        filtered_lines = []
        removed_count = 0

        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                filtered_lines.append(line)
                continue

            should_remove = False

            # Check each filter string with fuzzy matching
            for filter_string in self.filter_strings:
                # Use fuzzy matching with 85% threshold for removal
                similarity = fuzz.ratio(line_stripped.upper(), filter_string.upper())

                # Also check if filter string is contained in the line
                if (similarity >= 85 or
                    filter_string.upper() in line_stripped.upper() or
                    line_stripped.upper() in filter_string.upper()):
                    should_remove = True
                    removed_count += 1
                    self.logger.debug(f"Removing line '{line_stripped}' (matched '{filter_string}', similarity: {similarity}%)")
                    break

            if not should_remove:
                filtered_lines.append(line)

        if removed_count > 0:
            self.logger.info(f"Removed {removed_count} lines matching filter strings")

        return '\n'.join(filtered_lines)

    def _extract_person_name_from_filename(self, filename: str) -> List[str]:
        """Extract potential person names from the filename"""
        if not filename:
            return []

        # Remove file extension
        name_part = Path(filename).stem

        # Split on "_-_" and use the right-hand side
        # Example: "Senior_Software_Engineer_-_John_Smith" -> "John_Smith"
        if '_-_' in name_part:
            parts = name_part.split('_-_')
            # Use everything to the right of the "_-_" separator
            name_part = parts[-1]  # Take the rightmost part

        # Remove common resume keywords
        resume_keywords = ['resume', 'cv', 'curriculum', 'vitae', 'updated', 'final', 'latest', 'new', 'current', '2024', '2023', '2025']
        for keyword in resume_keywords:
            name_part = re.sub(rf'\b{keyword}\b', '', name_part, flags=re.IGNORECASE)

        # Remove common separators and clean up
        name_part = re.sub(r'[_\-\.\s]+', ' ', name_part).strip()

        # Split into potential name components
        name_components = [comp.strip() for comp in name_part.split() if len(comp) >= 2]

        # Filter out numbers, single characters, and common non-name words
        filtered_components = []
        non_name_words = ['doc', 'pdf', 'file', 'document', 'copy', 'version', 'v1', 'v2', 'v3', 'final', 'draft']

        for component in name_components:
            if (not component.isdigit() and
                len(component) >= 2 and
                component.lower() not in non_name_words and
                not re.match(r'^[v]\d+$', component.lower())):  # version patterns like v1, v2
                filtered_components.append(component)

        # Generate potential name combinations
        potential_names = []
        if filtered_components:
            # Add individual components
            potential_names.extend(filtered_components)

            # Add full name combinations
            if len(filtered_components) >= 2:
                # First + Last
                potential_names.append(f"{filtered_components[0]} {filtered_components[-1]}")
                # All components together
                potential_names.append(" ".join(filtered_components))

                # First + Middle + Last if 3 or more components
                if len(filtered_components) >= 3:
                    potential_names.append(f"{filtered_components[0]} {filtered_components[1]} {filtered_components[-1]}")

        # Filter out very short or very long names
        final_names = [name for name in potential_names if 2 <= len(name) <= 50]

        if final_names:
            self.logger.info(f"Extracted potential names from filename '{filename}': {final_names}")

        return final_names

    def _remove_person_name_from_content(self, content: str, filename: str) -> str:
        """Remove person's name from content using fuzzy matching"""
        if not content or not filename:
            return content

        potential_names = self._extract_person_name_from_filename(filename)
        if not potential_names:
            return content

        lines = content.split('\n')
        filtered_lines = []
        removed_count = 0

        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                filtered_lines.append(line)
                continue

            should_remove_line = False
            original_line = line_stripped

            # Check if entire line should be removed (if it's mostly just the person's name)
            for name in potential_names:
                # Check if the line is primarily the person's name
                similarity = fuzz.ratio(line_stripped.upper(), name.upper())
                if similarity >= 80:  # High threshold for removing entire line
                    should_remove_line = True
                    removed_count += 1
                    self.logger.debug(f"Removing entire line '{line_stripped}' (name match: '{name}', similarity: {similarity}%)")
                    break

            if should_remove_line:
                continue

            # If not removing the entire line, try to remove name mentions within the line
            modified_line = line_stripped
            for name in potential_names:
                # Remove exact matches (case insensitive)
                name_pattern = re.escape(name)
                modified_line = re.sub(rf'\b{name_pattern}\b', '[NAME_REMOVED]', modified_line, flags=re.IGNORECASE)

                # Also check individual name components
                name_words = name.split()
                if len(name_words) > 1:
                    for word in name_words:
                        if len(word) >= 3:  # Only remove words of 3+ characters to avoid false positives
                            word_pattern = re.escape(word)
                            # Use fuzzy matching for individual words
                            words_in_line = modified_line.split()
                            new_words = []
                            for line_word in words_in_line:
                                clean_word = re.sub(r'[^\w]', '', line_word)  # Remove punctuation for matching
                                if (len(clean_word) >= 3 and
                                    fuzz.ratio(clean_word.upper(), word.upper()) >= 85):
                                    new_words.append('[NAME_REMOVED]')
                                    self.logger.debug(f"Replaced word '{line_word}' with [NAME_REMOVED] (fuzzy match: '{word}')")
                                else:
                                    new_words.append(line_word)
                            modified_line = ' '.join(new_words)

            # Clean up multiple consecutive [NAME_REMOVED] tokens
            modified_line = re.sub(r'\[NAME_REMOVED\](\s*\[NAME_REMOVED\])+', '[NAME_REMOVED]', modified_line)

            # Clean up extra spaces
            modified_line = re.sub(r'\s+', ' ', modified_line).strip()

            # Only keep the line if it has substantial content after name removal
            if modified_line and modified_line != '[NAME_REMOVED]' and len(modified_line.replace('[NAME_REMOVED]', '').strip()) > 5:
                filtered_lines.append(modified_line)
            elif original_line != modified_line:
                removed_count += 1
                self.logger.debug(f"Removed line after name removal: '{original_line}' -> '{modified_line}'")

        if removed_count > 0:
            self.logger.info(f"Removed or modified {removed_count} lines containing person's name")

        return '\n'.join(filtered_lines)

    def _extract_exact_skills(self, skills_text: str) -> List[str]:
        """Extract skills using exact 1:1 matching"""
        if not skills_text:
            return []

        found_skills = []
        skills_upper = skills_text.upper()

        for skill in self.exact_skills:
            # Check for exact match (case insensitive)
            skill_upper = skill.upper()

            # Look for the skill as a whole word
            pattern = r'\b' + re.escape(skill_upper) + r'\b'
            if re.search(pattern, skills_upper):
                found_skills.append(skill)

        # Also look for common skill patterns like bullet points
        lines = skills_text.split('\n')
        for line in lines:
            line = line.strip()
            # Remove bullet points and clean up
            clean_line = re.sub(r'^[•\-\*\+]\s*', '', line)
            clean_line = clean_line.strip(' •-*+')

            if clean_line:
                for skill in self.exact_skills:
                    if clean_line.upper() == skill.upper():
                        if skill not in found_skills:
                            found_skills.append(skill)

        self.logger.info(f"Found {len(found_skills)} exact skill matches")
        return found_skills

    def _parse_experience_entries(self, experience_text: str) -> List[Dict[str, str]]:
        """Parse work experience entries"""
        if not experience_text:
            return []

        experiences = []

        # Split by common separators that indicate new job entries
        # Look for patterns like job titles, company names, dates
        entries = re.split(r'\n(?=[A-Z][^a-z\n]*(?:Engineer|Manager|Developer|Analyst|Director|Specialist|Consultant|Lead|Senior|Junior))', experience_text)

        for entry in entries:
            entry = entry.strip()
            if len(entry) < 20:  # Skip very short entries
                continue

            exp_data = self._parse_single_experience_entry(entry)
            if exp_data:
                experiences.append(exp_data)

        return experiences

    def _parse_single_experience_entry(self, entry: str) -> Optional[Dict[str, str]]:
        """Parse a single work experience entry"""
        lines = [line.strip() for line in entry.split('\n') if line.strip()]

        if not lines:
            return None

        experience = {
            'title': '',
            'company': '',
            'dates': '',
            'description': ''
        }

        # First line is usually the job title
        experience['title'] = lines[0]

        # Look for dates in the entry
        date_patterns = [
            r'\b\d{4}\s*[-–]\s*\d{4}\b',
            r'\b\d{4}\s*[-–]\s*Present\b',
            r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b',
            r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–]\s*Present\b'
        ]

        for line in lines:
            for pattern in date_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    experience['dates'] = match.group(0)
                    break

        # Look for company name (often on second line or contains "at", "Inc", "LLC", "Corp")
        for line in lines[1:]:
            if any(indicator in line for indicator in ['Inc', 'LLC', 'Corp', 'Ltd', 'Company', ' at ']):
                experience['company'] = line.strip()
                break

        # Combine remaining lines as description
        desc_lines = []
        for line in lines[1:]:
            if line != experience['company'] and experience['dates'] not in line:
                desc_lines.append(line)

        experience['description'] = ' '.join(desc_lines) if desc_lines else ''

        return experience if experience['title'] else None

    def _parse_education_entries(self, education_text: str) -> List[Dict[str, str]]:
        """Parse education entries"""
        if not education_text:
            return []

        education_entries = []

        # Split by common separators
        entries = re.split(r'\n(?=[A-Z])', education_text)

        for entry in entries:
            entry = entry.strip()
            if len(entry) < 10:
                continue

            edu_data = self._parse_single_education_entry(entry)
            if edu_data:
                education_entries.append(edu_data)

        return education_entries

    def _parse_single_education_entry(self, entry: str) -> Optional[Dict[str, str]]:
        """Parse a single education entry"""
        lines = [line.strip() for line in entry.split('\n') if line.strip()]

        if not lines:
            return None

        education = {
            'degree': '',
            'institution': '',
            'year': '',
            'gpa': ''
        }

        # Look for degree patterns
        degree_patterns = [
            r'\b(?:Bachelor|Bachelors|Master|Masters|PhD|Ph\.D\.|Doctorate|Associate|Associates|MBA|BS|BA|MS|MA|BSc|MSc|Certificate|Diploma)\b.*',
            r'\b(?:B\.S\.|B\.A\.|M\.S\.|M\.A\.|Ph\.D\.|A\.S\.|A\.A\.)\s.*',
            r'\b(?:Associate of|Bachelor of|Master of|Doctor of)\b.*',
            r'\b(?:AS|AA|AAS|BFA|MFA|DBA|EdD|JD|MD)\b.*',
            r'\b(?:BS|BA|MS|MA|PhD)\s+.*'
        ]

        for line in lines:
            for pattern in degree_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    education['degree'] = match.group(0).strip()
                    break

        # Look for years
        for line in lines:
            year_match = re.search(r'\b(19|20)\d{2}\b', line)
            if year_match:
                education['year'] = year_match.group(0)

        # Look for GPA
        for line in lines:
            gpa_match = re.search(r'\bGPA:?\s*(\d+\.?\d*)\b', line, re.IGNORECASE)
            if gpa_match:
                education['gpa'] = gpa_match.group(1)

        # Institution is usually the line that doesn't contain degree or GPA
        for line in lines:
            if (education['degree'] not in line and
                'GPA' not in line.upper() and
                education['year'] not in line):
                education['institution'] = line.strip()
                break

        return education if education['degree'] or education['institution'] else None

    def _parse_certification_entries(self, cert_text: str) -> List[str]:
        """Parse certification entries"""
        if not cert_text:
            return []

        certifications = []

        # Split by lines and clean up
        lines = cert_text.split('\n')
        for line in lines:
            line = line.strip()
            # Remove bullet points
            line = re.sub(r'^[•\-\*\+]\s*', '', line)
            line = line.strip()

            if line and len(line) >= 3:
                certifications.append(line)

        return certifications


# Create a singleton instance
section_parser = RawSectionParser()