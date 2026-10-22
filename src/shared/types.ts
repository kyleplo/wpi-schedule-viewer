export type CourseDBTuple = {
    code: string, //  ex. "CS 4241"
    section: string, // ex. "A01"
    academicYear: Number, // Year - 1 for terms excluding A, B, and AB
}

export type User = {
    username: string
    password: string
    token: string
    tokenExpiry: number
    courses: CourseDBTuple[]
}

export type Term = "A" | "B" | "C" | "D" | "E1" | "E2" | "F" | "S" | "E" | "G";

export type CourseMeetingPattern = {
    day: number,
    startTime: number,
    endTime: number,
    startDate: number,
    endDate: number,
    location: string
};

export type CourseSection = {
    type: string;
    name: string;
    code: string;
    section: string;
    term: Term;
    academicYearStart: number;
    academicYearEnd: number;
    meetings: CourseMeetingPattern[];
    professors: string[];
}

export type CourseListingsCourseSection = {
    "Course_Section_Start_Date": string,
    "Meeting_Patterns": string,
    "Course_Title": string,
    "Locations": string,
    "Instructional_Format": string,
    "Section_Details": string,
    "Instructors": string,
    "Offering_Period": string,
    "Starting_Academic_Period_Type": string,
    "Course_Section": string,
    "Course_Section_End_Date": string,
    "Meeting_Day_Patterns": string,
}
export type altDay = {
    "date" : Date, 
    "schedule" : string
}