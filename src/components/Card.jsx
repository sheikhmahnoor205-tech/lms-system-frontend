import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import './Card.css';

export default function Card() {
  const { students } = useAttendance();

  const totalStudents = students.length;
  const avgAttendance = totalStudents > 0 
    ? Math.round(students.reduce((sum, s) => sum + (Number(s.attendance) || 0), 0) / totalStudents) 
    : 0;

  const avgMarks = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => {
        const m = Number(s.midterm) || 0;
        const f = Number(s.final) || 0;
        const sec = Number(s.sectional) || 0;
        return sum + (s.totalMarks !== undefined ? Number(s.totalMarks) : (m + f + sec));
      }, 0) / totalStudents)
    : 0;

  const avgCGPA = totalStudents > 0
    ? (students.reduce((sum, s) => sum + (Number(s.cgpa) || 0), 0) / totalStudents).toFixed(2)
    : '0.00';

  return (
    <div>
      <div className="dashboardCards">
        <div className="card">
          <div className="content">
            <h3>Total Students</h3>
            <p>{totalStudents}</p>
          </div>
        </div>

        <div className="card2">
          <div className="content2">
            <h3>Students Attendance</h3>
            <p>{avgAttendance}%</p>
          </div>
        </div>

        <div className="card3">
          <div className="content3">
            <h3>Avg Total Marks</h3>
            <p>{avgMarks} / 100</p>
          </div>
        </div>

        <div className="card4">
          <div className="content4">
            <h3>Average CGPA</h3>
            <p>{avgCGPA}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
