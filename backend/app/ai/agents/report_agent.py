from app import mongo
from app.ai.llm.ollama_client import ollama_client

class ReportAgent:
    def process(self, history, system_prompt, patient_id):
        if not patient_id:
            return "Please log in to check your medical reports."
            
        # Get the latest report uploaded by the patient from database
        latest_report = mongo.db.reports.find_one(
            {'patient_id': patient_id},
            sort=[('uploaded_at', -1)]
        )
        
        if not latest_report:
            return (
                "You haven't uploaded any medical reports yet. "
                "You can upload your reports (blood reports, prescriptions, X-rays, etc.) "
                "on your Profile page, and I will analyze them for you."
            )
            
        text = latest_report.get('extracted_text', '')
        filename = latest_report.get('filename', 'report.pdf')
        
        report_context = (
            f"\n\nLATEST UPLOADED MEDICAL REPORT DETAILS:\n"
            f"- Filename: {filename}\n"
            f"- Extracted text (OCR/PDF text):\n"
            f"\"\"\"\n{text[:1500]}\n\"\"\"\n"
        )
        
        instruction = (
            "\n\nINSTRUCTION: Summarize this medical report in simple, non-technical terms. "
            "Outline:\n"
            "1. **Quick Summary**: A high-level overview of the test.\n"
            "2. **Abnormal Values**: Any out-of-range figures (high/low compared to reference values).\n"
            "3. **Key Concerns**: Possible issues to keep in mind.\n"
            "4. **Questions for your Doctor**: 2-3 specific questions they should ask their physician.\n\n"
            "State clearly that this is an AI-generated summary, not a medical diagnosis."
        )
        
        return ollama_client.chat(history, system_prompt=system_prompt + report_context + instruction)

# Single global instance
report_agent = ReportAgent()
