from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_engine('postgresql://androz2091:postgres2020mini@localhost:5432/ddpe', echo=True)

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
