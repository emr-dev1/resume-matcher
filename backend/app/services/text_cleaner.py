import re
import logging
from typing import Optional, Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)


class TextCleaner:
    """Service for cleaning and optimizing resume text for embedding generation"""
    
    def __init__(self):
        # Common resume noise patterns to remove
        self.noise_patterns = [
            # Page numbers and references
            r'\bpage\s+\d+\b',
            r'\bpage\s+\d+\s+of\s+\d+\b',
            r'^\d+\s*$',  # Standalone numbers
            
            # Common footer/header text
            r'confidential\s*resume',
            r'references\s+available\s+upon\s+request',
            r'references\s+furnished\s+upon\s+request',
            r'resume\s+of\s+',
            
            # Contact info patterns (preserve structure but reduce verbosity)
            r'phone\s*:?\s*\(?(\d{3})\)?\s*[-.]?\s*(\d{3})\s*[-.]?\s*(\d{4})',
            r'email\s*:?\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            r'linkedin\s*:?\s*linkedin\.com/in/[\w-]+',
            
            # Repeated separators and formatting
            r'[-_=]{3,}',  # Multiple dashes/underscores
            r'[•·]{2,}',   # Multiple bullets
            r'\*{2,}',     # Multiple asterisks
            
            # Empty sections
            r'^\s*[-•·]\s*$',  # Empty bullet points
        ]
        
        # Low-value sections to remove or minimize
        self.low_value_sections = [
            'objective', 'career objective', 'professional objective',
            'references', 'reference', 'personal references',
            'hobbies', 'interests', 'personal interests',
            'activities', 'extracurricular activities'
        ]
        
        # High-value keywords to preserve
        self.high_value_keywords = [
            # Technical skills
            'python', 'java', 'javascript', 'react', 'angular', 'vue',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git',
            'sql', 'nosql', 'mongodb', 'postgresql', 'mysql',
            'machine learning', 'ai', 'data science', 'analytics',
            
            # Professional terms
            'managed', 'led', 'developed', 'implemented', 'designed',
            'improved', 'optimized', 'created', 'built', 'delivered',
            'achieved', 'increased', 'reduced', 'streamlined',
            
            # Education/Certifications
            'degree', 'bachelor', 'master', 'phd', 'certification',
            'certified', 'license', 'accredited'
        ]
    
    def clean_text(self, text: str, intensity: str = "medium") -> str:
        """
        Clean and optimize text for embedding generation
        
        Args:
            text: Raw extracted text
            intensity: Cleaning intensity ('light', 'medium', 'aggressive')
        
        Returns:
            Cleaned and optimized text
        """
        if not text:
            return ""
        
        original_length = len(text)
        
        # Step 1: Basic normalization
        cleaned = self._normalize_text(text)
        
        # Step 2: Remove noise patterns
        cleaned = self._remove_noise_patterns(cleaned)
        
        # Step 3: Clean whitespace and formatting
        cleaned = self._clean_formatting(cleaned)
        
        # Step 4: Apply intensity-specific cleaning
        if intensity == "aggressive":
            cleaned = self._aggressive_cleaning(cleaned)
        elif intensity == "medium":
            cleaned = self._medium_cleaning(cleaned)
        else:  # light
            cleaned = self._light_cleaning(cleaned)
        
        # Step 5: Final optimization
        cleaned = self._final_optimization(cleaned)
        
        # Log compression ratio
        final_length = len(cleaned)
        compression_ratio = (original_length - final_length) / original_length * 100
        logger.info(f"Text cleaned: {original_length} -> {final_length} chars ({compression_ratio:.1f}% reduction)")
        
        return cleaned
    
    def _normalize_text(self, text: str) -> str:
        """Basic text normalization"""
        # Fix encoding issues
        text = text.encode('utf-8', errors='ignore').decode('utf-8')
        
        # Normalize unicode characters
        text = re.sub(r'[""''']', '"', text)  # Smart quotes to regular quotes
        text = re.sub(r'[–—]', '-', text)     # Em/en dashes to hyphens
        text = re.sub(r'[…]', '...', text)    # Ellipsis
        
        # Remove zero-width characters
        text = re.sub(r'[\u200b\u200c\u200d\ufeff]', '', text)
        
        return text
    
    def _remove_noise_patterns(self, text: str) -> str:
        """Remove common noise patterns"""
        for pattern in self.noise_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.MULTILINE)
        
        return text
    
    def _clean_formatting(self, text: str) -> str:
        """Clean up formatting and whitespace"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)  # Multiple spaces to single
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Multiple newlines to double
        text = re.sub(r'^\s+|\s+$', '', text, flags=re.MULTILINE)  # Trim lines
        
        # Clean up common formatting artifacts
        text = re.sub(r'\s*[|]\s*', ' | ', text)  # Normalize pipe separators
        text = re.sub(r'\s*[,]\s*', ', ', text)   # Normalize commas
        text = re.sub(r'\s*[:]\s*', ': ', text)   # Normalize colons
        
        return text
    
    def _light_cleaning(self, text: str) -> str:
        """Light cleaning - minimal changes"""
        # Only remove obvious noise
        text = re.sub(r'\b(page\s+\d+|confidential)\b', '', text, flags=re.IGNORECASE)
        return text
    
    def _medium_cleaning(self, text: str) -> str:
        """Medium cleaning - balanced approach"""
        # Remove low-value sections
        for section in self.low_value_sections:
            pattern = rf'\b{re.escape(section)}\b.*?(?=\n\n|\n[A-Z]|$)'
            text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
        
        # Compress repetitive job descriptions
        text = self._compress_repetitive_content(text)
        
        return text
    
    def _aggressive_cleaning(self, text: str) -> str:
        """Aggressive cleaning - maximum compression"""
        # Apply medium cleaning first
        text = self._medium_cleaning(text)
        
        # Additional aggressive measures
        # Remove contact details completely
        text = re.sub(r'^\s*(?:address|phone|email|linkedin).*$', '', text, flags=re.IGNORECASE | re.MULTILINE)
        
        # Remove dates from older experience (keep recent)
        current_year = datetime.now().year
        old_date_pattern = rf'\b(?:19\d{{2}}|20(?:0\d|1[0-{str(current_year-5)[-1]}]))\b'
        text = re.sub(old_date_pattern, '', text)
        
        # Compress long descriptions
        text = self._compress_long_descriptions(text)
        
        return text
    
    def _compress_repetitive_content(self, text: str) -> str:
        """Compress repetitive job descriptions and skills"""
        # Find and compress similar job descriptions
        lines = text.split('\n')
        unique_lines = []
        seen_content = set()
        
        for line in lines:
            # Create a normalized version for comparison
            normalized = re.sub(r'\d+', 'NUM', line.lower().strip())
            normalized = re.sub(r'\b(the|and|or|of|in|at|to|for|with)\b', '', normalized)
            
            if len(normalized) < 10 or normalized not in seen_content:
                unique_lines.append(line)
                seen_content.add(normalized)
        
        return '\n'.join(unique_lines)
    
    def _compress_long_descriptions(self, text: str) -> str:
        """Compress overly long descriptions"""
        paragraphs = text.split('\n\n')
        compressed = []
        
        for paragraph in paragraphs:
            # If paragraph is very long, try to extract key sentences
            if len(paragraph) > 500:
                sentences = re.split(r'[.!?]+', paragraph)
                key_sentences = []
                
                for sentence in sentences:
                    sentence = sentence.strip()
                    if len(sentence) < 20:
                        continue
                    
                    # Keep sentences with high-value keywords
                    if any(keyword in sentence.lower() for keyword in self.high_value_keywords):
                        key_sentences.append(sentence)
                    elif len(key_sentences) < 3:  # Keep first few sentences
                        key_sentences.append(sentence)
                
                compressed.append('. '.join(key_sentences[:5]))  # Max 5 sentences
            else:
                compressed.append(paragraph)
        
        return '\n\n'.join(compressed)
    
    def _final_optimization(self, text: str) -> str:
        """Final optimization pass"""
        # Remove empty lines
        text = re.sub(r'\n\s*\n', '\n', text)
        
        # Ensure single space between words
        text = re.sub(r'\s+', ' ', text)
        
        # Final trim
        text = text.strip()
        
        return text
    
    def estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for text
        Rough estimation: 1 token ≈ 4 characters for English text
        """
        return len(text) // 4
    
    def truncate_to_token_limit(self, text: str, max_tokens: int = 2000) -> str:
        """
        Intelligently truncate text to fit within token limit
        Preserves important sections and maintains readability
        """
        estimated_tokens = self.estimate_tokens(text)
        
        if estimated_tokens <= max_tokens:
            return text
        
        # Calculate target character count
        target_chars = max_tokens * 4
        
        # Try to preserve important sections
        paragraphs = text.split('\n\n')
        result = []
        current_length = 0
        
        # Prioritize paragraphs with high-value keywords
        scored_paragraphs = []
        for paragraph in paragraphs:
            score = sum(1 for keyword in self.high_value_keywords 
                       if keyword.lower() in paragraph.lower())
            scored_paragraphs.append((score, paragraph))
        
        # Sort by score (descending) to prioritize important content
        scored_paragraphs.sort(key=lambda x: x[0], reverse=True)
        
        for score, paragraph in scored_paragraphs:
            if current_length + len(paragraph) <= target_chars:
                result.append(paragraph)
                current_length += len(paragraph) + 2  # +2 for \n\n
            else:
                # Add partial paragraph if space remains
                remaining_space = target_chars - current_length
                if remaining_space > 100:  # Only if meaningful space left
                    truncated = paragraph[:remaining_space-3] + "..."
                    result.append(truncated)
                break
        
        final_text = '\n\n'.join(result)
        logger.info(f"Text truncated: {len(text)} -> {len(final_text)} chars")
        
        return final_text
    
    def clean_and_optimize(self, text: str, intensity: str = "medium", 
                          max_tokens: int = 2000) -> str:
        """
        Complete cleaning and optimization pipeline
        
        Args:
            text: Raw extracted text
            intensity: Cleaning intensity ('light', 'medium', 'aggressive')
            max_tokens: Maximum token limit for output
            
        Returns:
            Cleaned and optimized text ready for embedding
        """
        # Step 1: Clean the text
        cleaned = self.clean_text(text, intensity)
        
        # Step 2: Truncate if needed
        optimized = self.truncate_to_token_limit(cleaned, max_tokens)
        
        return optimized


# Global instance
text_cleaner = TextCleaner()