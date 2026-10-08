from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, SessionLocal, Base
from app.routers import auth, evaluation, departments, classes, courses, teachers, specializations, subjects, students, timetable, results
from app.models.user import User
from app.models.department import Department, Course
from app.models.class_model import ClassModel
from app.services.auth import get_password_hash

# Create Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EvalAI | Modular Backend")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed initial user
def seed_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "hisham@gmail.com").first()
        if not user:
            new_user = User(
                email="hisham@gmail.com",
                hashed_password=get_password_hash("Hisham@123"),
                name="Hisham"
            )
            db.add(new_user)
            db.commit()
            print("Seeded user 'hisham@gmail.com'.")
    except Exception as e:
        print(f"Skipping seeding (DB may info): {e}")
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    seed_user()

# Include Routers
app.include_router(auth.router)
app.include_router(evaluation.router)
app.include_router(departments.router)
app.include_router(courses.router)
app.include_router(classes.router)
app.include_router(teachers.router)
app.include_router(specializations.router)
app.include_router(subjects.router)
app.include_router(students.router)
app.include_router(timetable.router)
app.include_router(results.router)

@app.get("/")
def root():
    return {"message": "EvalAI Modular API is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
