import os

from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_engine(os.getenv('POSTGRES_URL'), echo=True)

Base = declarative_base()

class SavedPackageData(Base):
    __tablename__ = 'saved_package_data'

    id = Column(Integer, primary_key=True)
    package_id = Column(String(255), nullable=False)
    data = Column(String(), nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)

class PackageProcessStatus(Base):
    __tablename__ = 'package_process_status'

    id = Column(Integer, primary_key=True)
    package_id = Column(String(255), nullable=False)
    step = Column(String(255), nullable=False)
    progress = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)

Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)
session = Session()

def update_progress (package_id, current_progress):
    print('updating progress')
    package = session.query(PackageProcessStatus).filter_by(package_id=package_id).first()
    if package:
        package.progress = current_progress
        package.updated_at = datetime.now()
        print('updating progress SUCCESS')
        session.commit()

def update_step (package_id, step):
    package = session.query(PackageProcessStatus).filter_by(package_id=package_id).first()
    if package:
        package.step = step
        package.updated_at = datetime.now()
        session.commit()
