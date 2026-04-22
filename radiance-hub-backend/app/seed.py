"""
Seed script to create initial users and sample studies on first startup.
Run automatically from main.py on startup.
"""
import uuid
import secrets
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models.user import User
from app.models.organization import Organization
from app.models.patient import Patient
from app.models.study import Study
from app.models.cms import LandingCms
from app.models.report import Report
from app.models.report_template import ReportTemplate
from app.models.report_branding import ReportBranding
from app.models.study_note import StudyNote


SEED_USERS = [
    {
        "email": "sahil@gmail.com",
        "full_name": "Sahil Admin",
        "password": "12345678",
        "roles": ["super_admin"],
        "status": "approved",
        "organization": "Aspire HQ",
    },
    {
        "email": "admin@aspire.local",
        "full_name": "System Admin",
        "password": "admin123",
        "roles": ["super_admin"],
        "status": "approved",
        "organization": "Aspire HQ",
    },
    {
        "email": "rad@aspire.local",
        "full_name": "Dr. Smith (Radiologist)",
        "password": "rad123",
        "roles": ["radiologist"],
        "status": "approved",
        "organization": "Independent Radiology",
    },
    {
        "email": "verifier@aspire.local",
        "full_name": "Dr. Jones (Verifier)",
        "password": "verifier123",
        "roles": ["verifier"],
        "status": "approved",
        "organization": "Quality Check Inc",
    },
    {
        "email": "typist@aspire.local",
        "full_name": "Mary typist",
        "password": "typist123",
        "roles": ["typist"],
        "status": "approved",
        "organization": "Aspire HQ",
    },
    {
        "email": "hospital@aspire.local",
        "full_name": "City Hospital Staff",
        "password": "hospital123",
        "roles": ["hospital"],
        "status": "approved",
        "organization": "City General Hospital",
    },
]

SAMPLE_STUDIES = [
    {
        "modality": "CT",
        "body_part": "Chest",
        "description": "CT Chest with contrast",
        "status": "new_study_received",
        "patient_name": "John Doe",
        "patient_id": "P001",
        "referring_hospital": "City Hospital"
    },
    {
        "modality": "MR",
        "body_part": "Brain",
        "description": "MRI Brain routine",
        "status": "pending_assignment",
        "patient_name": "Jane Smith",
        "patient_id": "P002",
        "referring_hospital": "City Hospital"
    },
    {
        "modality": "XR",
        "body_part": "Chest",
        "description": "Chest X-Ray PA view",
        "status": "assigned_to_doctor",
        "patient_name": "Alice Johnson",
        "patient_id": "P003",
        "referring_hospital": "Metro Clinic"
    },
    {
        "modality": "CT",
        "body_part": "Abdomen",
        "description": "CT Abdomen screening",
        "status": "report_in_progress",
        "patient_name": "Bob Williams",
        "patient_id": "P004",
        "referring_hospital": "City Hospital"
    },
    {
        "modality": "MR",
        "body_part": "Spine",
        "description": "MRI Lumbar Spine",
        "status": "verification_pending",
        "patient_name": "Carol Davis",
        "patient_id": "P005",
        "referring_hospital": "Spine Center"
    },
    {
        "modality": "USG",
        "body_part": "Abdomen",
        "description": "Ultrasound Abdomen",
        "status": "report_completed",
        "patient_name": "David Brown",
        "patient_id": "P006",
        "referring_hospital": "Metro Clinic"
    },
]

TEMPLATES = [
    {"name": "Normal CT Chest", "modality": "CT", "content": "<h1>CT Chest Report</h1><p>Findings: Normal study.</p>"},
    {"name": "Normal MRI Brain", "modality": "MR", "content": "<h1>MRI Brain Report</h1><p>Findings: No acute abnormality detected.</p>"},
]


def seed_database(db: Session):
    # 1. Seed Organization
    org = db.query(Organization).filter(Organization.slug == "aspire-hq").first()
    if not org:
        org = Organization(
            name="Aspire Headquarters",
            slug="aspire-hq",
            type="teleradiology",
            address="123 Aspire Way, Health City",
            is_active=True,
            report_verification_enabled=True
        )
        db.add(org)
        db.commit()
        db.refresh(org)

    # 2. Seed users
    for u_data in SEED_USERS:
        existing = db.query(User).filter(User.email == u_data["email"]).first()
        if not existing:
            user = User(
                email=u_data["email"],
                full_name=u_data["full_name"],
                hashed_password=hash_password(u_data["password"]),
                roles=u_data["roles"],
                status=u_data["status"],
                organization=u_data.get("organization"),
                organization_id=org.id
            )
            db.add(user)
    db.commit()

    # Get some user IDs for foreign keys
    admin_user = db.query(User).filter(User.roles.contains(["super_admin"])).first()
    rad_user = db.query(User).filter(User.roles.contains(["radiologist"])).first()

    # 3. Seed CMS
    if not db.query(LandingCms).filter(LandingCms.id == 1).first():
        db.add(LandingCms(id=1))
        db.commit()

    # 4. Seed Branding
    if not db.query(ReportBranding).filter(ReportBranding.organization_id == org.id).first():
        branding = ReportBranding(
            organization_id=org.id,
            header_height_px=120,
            footer_height_px=80,
            is_active=True
        )
        db.add(branding)
        db.commit()

    # 5. Seed Templates
    for t_data in TEMPLATES:
        if not db.query(ReportTemplate).filter(ReportTemplate.name == t_data["name"]).first():
            tmpl = ReportTemplate(
                name=t_data["name"],
                modality=t_data["modality"],
                content_html=t_data["content"],
                is_global=True
            )
            db.add(tmpl)
    db.commit()

    # 6. Seed Patients & Studies
    if db.query(Study).count() == 0:
        from app.models.verification import VerificationRecord

        # Get verifier for seeding records
        verifier_user = db.query(User).filter(User.roles.contains(["verifier"])).first()

        for i, s_data in enumerate(SAMPLE_STUDIES):
            # Create Patient record first
            patient = db.query(Patient).filter(Patient.patient_uid == s_data["patient_id"]).first()
            if not patient:
                patient = Patient(
                    patient_uid=s_data["patient_id"],
                    name=s_data["patient_name"],
                    gender="M" if i % 2 == 0 else "F",
                    age=30 + i,
                    organization_id=org.id
                )
                db.add(patient)
                db.flush()

            # Create Study
            study = Study(
                study_instance_uid=f"1.2.840.{uuid.uuid4().int % 10**12}.{i + 1}",
                accession_number=f"ACC{2024001 + i}",
                modality=s_data["modality"],
                body_part=s_data["body_part"],
                study_date=date.today() - timedelta(days=i),
                description=s_data["description"],
                patient_id=s_data["patient_id"],
                patient_name=s_data["patient_name"],
                patient_sex=patient.gender,
                patient_record_id=patient.id,
                status=s_data["status"],
                organization_id=org.id,
                referring_hospital=s_data.get("referring_hospital"),
                pacs_source_name="Orthanc-Local",
            )
            
            # Conditionally assign if progress has started
            if s_data["status"] in ["assigned_to_doctor", "report_in_progress", "verification_pending", "report_completed"]:
                study.assignee_id = rad_user.id
            
            db.add(study)
            db.flush()

            # Add a sample note
            note = StudyNote(
                study_id=study.id,
                author_id=admin_user.id,
                content=f"Initial seed note for study {study.accession_number}",
                note_type="general"
            )
            db.add(note)

            # Add a sample report if completed or pending verification
            if s_data["status"] in ["verification_pending", "report_completed"]:
                report = Report(
                    study_id=study.id,
                    author_id=rad_user.id,
                    status="SUBMITTED" if s_data["status"] == "verification_pending" else "FINALIZED",
                    content_html=f"<h1>Report for {study.accession_number}</h1><p>Seeded finding.</p>",
                    content_text="Seeded finding.",
                    version=1
                )
                db.add(report)
                db.flush()

                # If completed, add a verification record
                if s_data["status"] == "report_completed":
                    vr = VerificationRecord(
                        study_id=study.id,
                        verifier_id=verifier_user.id if verifier_user else admin_user.id,
                        status="verified",
                        notes="Seeded verification: Looks good."
                    )
                    db.add(vr)
                
                # Add a sample attachment (metadata only)
                from app.models.study_attachment import StudyAttachment
                attachment = StudyAttachment(
                    study_id=study.id,
                    uploader_id=admin_user.id,
                    file_name=f"referral_{study.accession_number}.pdf",
                    file_type="application/pdf",
                    file_size_bytes=1024 * 50,
                    storage_url=f"/api/studies/{study.id}/attachments/sample.pdf/download"
                )
                db.add(attachment)

                # Add a sample Audit Log
                from app.models.audit_log import AuditLog
                log = AuditLog(
                    study_id=study.id,
                    user_id=admin_user.id,
                    action="study_ingested",
                    details=f"Study {study.accession_number} ingested via Seed Script",
                )
                db.add(log)

        db.commit()
        print("Sample patients, studies, notes, and reports seeded.")

    print("Database seeding complete.")
    print(f"Login as Admin: {SEED_USERS[0]['email']} / {SEED_USERS[0]['password']}")
    print(f"Login as Rad:   {SEED_USERS[2]['email']} / {SEED_USERS[2]['password']}")
