import os
import csv
import random
from datetime import datetime, timedelta
from app import mongo

DEPARTMENTS = {
    'ENT': {'avg_time': 8, 'code': 'ENT'},
    'Cardiology': {'avg_time': 15, 'code': 'CARD'},
    'General': {'avg_time': 5, 'code': 'GEN'},
    'Dentist': {'avg_time': 20, 'code': 'DENT'},
    'Neurology': {'avg_time': 25, 'code': 'NEUR'},
    'Oncology': {'avg_time': 30, 'code': 'ONCO'}
}

HOSPITALS = ['HOSP-001', 'HOSP-002', 'HOSP-003']
DOCTORS = {
    'ENT': ['DOC-101'],
    'Cardiology': ['DOC-102'],
    'General': ['DOC-302'],
    'Dentist': ['DOC-301'],
    'Neurology': ['DOC-201'],
    'Oncology': ['DOC-202']
}

def generate_synthetic_data(num_records=500):
    """
    Generate highly realistic synthetic data for model bootstrapping.
    Features: hospital_id, department, doctor_id, queue_number, people_ahead, 
              current_serving, booked_time, served_time, actual_wait, hour, 
              weekday, holiday, emergency, no_show, doctor_average_time
    """
    records = []
    base_date = datetime.utcnow() - timedelta(days=30)
    
    for i in range(num_records):
        dept = random.choice(list(DEPARTMENTS.keys()))
        dept_info = DEPARTMENTS[dept]
        hosp = random.choice(HOSPITALS)
        doc = random.choice(DOCTORS.get(dept, ['DOC-GEN']))
        
        # Booking details
        booking_offset_days = random.randint(0, 30)
        booking_offset_hours = random.randint(8, 20)  # Working hours 8 AM - 8 PM
        booking_offset_mins = random.randint(0, 59)
        
        booked_time = base_date + timedelta(days=booking_offset_days, hours=booking_offset_hours, minutes=booking_offset_mins)
        hour = booked_time.hour
        weekday = booked_time.weekday()
        
        # Check if holiday
        holiday = 1 if weekday in [5, 6] or random.random() < 0.05 else 0
        
        # Queue positions
        current_serving = random.randint(0, 15)
        people_ahead = random.randint(0, 10)
        queue_number = current_serving + people_ahead + 1
        
        # Doctor avg time (with some doctor-specific variation)
        doc_avg_time = dept_info['avg_time'] + random.randint(-2, 3)
        doc_avg_time = max(3, doc_avg_time)
        
        # Emergencies ahead
        emergency = 1 if random.random() < 0.08 else 0
        emergency_cases = random.randint(1, 2) if (emergency and random.random() < 0.3) else (1 if emergency else 0)
        
        # No shows
        no_show = 1 if random.random() < 0.07 else 0
        
        # Calculate actual wait time:
        # Base wait = people_ahead * doc_avg_time
        # Peak load modifier (busy from 10 AM - 12 PM and 4 PM - 6 PM)
        is_peak = 1 if (10 <= hour <= 12 or 16 <= hour <= 18) else 0
        peak_multiplier = 1.3 if is_peak else 1.0
        
        # Emergencies add 15 minutes each
        emergency_delay = emergency_cases * 15.0
        
        if no_show:
            actual_wait = 0.0
            served_time = booked_time # served instantly or marked no_show
        else:
            base_wait = people_ahead * doc_avg_time * peak_multiplier + emergency_delay
            # Add random noise
            noise = random.normalvariate(0, 3)
            actual_wait = max(2.0, base_wait + noise)
            actual_wait = round(actual_wait, 2)
            served_time = booked_time + timedelta(minutes=actual_wait)
            
        records.append({
            'hospital_id': hosp,
            'department': dept,
            'doctor_id': doc,
            'queue_number': queue_number,
            'people_ahead': people_ahead,
            'current_serving': current_serving,
            'booked_time': booked_time.isoformat(),
            'served_time': served_time.isoformat(),
            'actual_wait': actual_wait,
            'hour': hour,
            'weekday': weekday,
            'holiday': holiday,
            'emergency': emergency,
            'no_show': no_show,
            'doctor_average_time': doc_avg_time
        })
        
    return records

def export_dataset_to_csv(output_path='datasets/queue_dataset.csv'):
    """
    Queries MongoDB for finished appointments, merges queue histories, and writes to CSV.
    If database contains fewer than 50 completed records, triggers synthetic seeder to ensure
    training data is always available for XGBoost / LightGBM.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Query completed appointments
    completed_appts = []
    try:
        if mongo and mongo.db is not None:
            completed_appts = list(mongo.db.appointments.find({'status': 'completed'}))
    except Exception as e:
        print(f"MongoDB connection failed: {e}. Defaulting to synthetic data seeder.")
    
    records = []
    
    for appt in completed_appts:
        booked_at = appt.get('booked_at')
        served_at = appt.get('served_at') or appt.get('booked_at')
        
        # ISO format to datetime
        if isinstance(booked_at, str):
            try: booked_at = datetime.fromisoformat(booked_at)
            except ValueError: booked_at = datetime.utcnow()
        if isinstance(served_at, str):
            try: served_at = datetime.fromisoformat(served_at)
            except ValueError: served_at = datetime.utcnow()
            
        actual_wait = appt.get('actual_wait', 0.0)
        if not actual_wait and served_at and booked_at:
            actual_wait = (served_at - booked_at).total_seconds() / 60.0
            actual_wait = max(0.0, round(actual_wait, 2))
            
        # Get doctor average time
        dept = appt.get('department', 'General')
        dept_info = DEPARTMENTS.get(dept, {'avg_time': 10})
        doc_avg_time = dept_info['avg_time']
        
        records.append({
            'hospital_id': appt.get('hospital_id', 'HOSP-001'),
            'department': dept,
            'doctor_id': appt.get('doctor_id', 'DOC-GEN'),
            'queue_number': appt.get('queue_number', 1),
            # Calculate simple estimations for missing details
            'people_ahead': max(0, appt.get('queue_number', 1) - 1),
            'current_serving': 0,
            'booked_time': booked_at.isoformat(),
            'served_time': served_at.isoformat(),
            'actual_wait': actual_wait,
            'hour': booked_at.hour,
            'weekday': booked_at.weekday(),
            'holiday': 1 if booked_at.weekday() in [5, 6] else 0,
            'emergency': 1 if 'emergency' in appt.get('symptoms', '').lower() else 0,
            'no_show': 0,
            'doctor_average_time': doc_avg_time
        })
        
    # Check if we need synthetic seeder
    if len(records) < 50:
        print(f"Database contains only {len(records)} real records. Generating synthetic data to bootstrap ML model...")
        synthetic_records = generate_synthetic_data(500 - len(records))
        records.extend(synthetic_records)
        
    # Write to CSV
    fields = [
        'hospital_id', 'department', 'doctor_id', 'queue_number', 'people_ahead', 
        'current_serving', 'booked_time', 'served_time', 'actual_wait', 'hour', 
        'weekday', 'holiday', 'emergency', 'no_show', 'doctor_average_time'
    ]
    
    with open(output_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for rec in records:
            writer.writerow(rec)
            
    print(f"Successfully exported {len(records)} records to {output_path}")
    return len(records)
