import cryptocode
import os

from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func, text

engine = create_engine(os.getenv('POSTGRES_URL'))

Base = declarative_base()

class SavedPackageData(Base):
    __tablename__ = 'saved_package_data'

    id = Column(Integer, primary_key=True)
    package_id = Column(String(255), nullable=False)
    data = Column(String(), nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, onupdate=func.now(), default=func.now())

class PackageProcessStatus(Base):
    __tablename__ = 'package_process_status'

    id = Column(Integer, primary_key=True)
    package_id = Column(String(255), nullable=False)
    step = Column(String(255), nullable=False)
    progress = Column(Integer, nullable=True)
    total_queue_when_started = Column(Integer, nullable=True)
    is_upgraded = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, onupdate=func.now(), default=func.now())

Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)

def update_progress (package_id, current_progress, session):
    package = session.query(PackageProcessStatus).filter_by(package_id=package_id).first()
    if package:
        package.progress = current_progress
        package.updated_at = datetime.now()
        session.commit()

def update_step (package_id, step, session):
    package = session.query(PackageProcessStatus).filter_by(package_id=package_id).first()
    if package:
        package.step = step
        package.updated_at = datetime.now()
        session.commit()

def fetch_package_rank (package_id, package_status, session):
    if not package_status:
        return None

    if package_status['is_upgraded']:
        row_count = session.execute(text("""
            select count(*) from package_process_status 
            where id < (select id from package_process_status where package_id = :package_id)
            and step <> 'processed'
            and is_upgraded is true;
        """), package_id=package_id).fetchone()[0]
        total_upgraded_row_count = session.execute(text("""
            select count(*) from package_process_status where step <> 'processed' and is_upgraded is true;
        """)).fetchone()[0]
        return (row_count, total_upgraded_row_count)
    
    row_count = session.execute(text("""
        select count(*) from package_process_status
        where id < (select id from package_process_status where package_id = :package_id)
        and step <> 'processed';
    """), package_id=package_id).fetchone()[0]
    total_row_count = session.execute(text("""
        select count(*) from package_process_status where step <> 'processed';
    """)).fetchone()[0]
    return (row_count, total_row_count)

def fetch_package_status(package_id, session):
    status = session.query(PackageProcessStatus).filter_by(package_id=package_id).first()
    return status

def fetch_package_data(package_id, auth_upn, session):
    status = session.query(PackageProcessStatus).filter_by(package_id=package_id).first()
    if status and status.step == 'processed':
        result = session.query(SavedPackageData).filter_by(package_id=package_id).first()
        data = cryptocode.decrypt(result.data, auth_upn)
        return data
