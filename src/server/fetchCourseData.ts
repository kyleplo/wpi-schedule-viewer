import { CourseListingsCourseSection, CourseMeetingPattern } from "../shared/types.js"
import { CourseSection, CourseSectionDocument } from "./models.js"

// Updates the course data in the database for the current year based on the
// data provided from WPI's server
export async function fetchCourseData() {
    // Fetch data
    let url = 'https://courselistings.wpi.edu/assets/prod-data.json'
    const response = await fetch(url)
    const data : any = await response.json()
    const yearcounts: { year: number, count: number }[] = []

    // Convert data to CourseSection objects
    const courseObjects: CourseSectionDocument[] = []
    data.Report_Entry.forEach((course: CourseListingsCourseSection) => {
        courseObjects.push(createCourseSection(course, yearcounts))
    });

    console.log('Deleting old data...')

    // Removes all the old courses for the years associated with the incoming file.
    // Assumes that any year with less than 10 courses associated with it is
    // erroneous data and discards it.
    let countDeleted = 0
    let countRemoved = 0
    // For each year, check if the count is less than 10
    for (const y of yearcounts) {
        if (y.count >= 10) {
            // If there are more than 10, delete all the old courses for that year
            let newdeleted = await CourseSection.deleteMany({ academicYearStart: y.year })
            countDeleted += await newdeleted.deletedCount
        }
        else {
            // Otherwise, discard all new courses for that year
            let nextOfYear = courseObjects.findIndex((e) => e.academicYearStart == y.year)
            while (nextOfYear !== -1) {
                countRemoved++
                courseObjects.splice(nextOfYear, 1)
                nextOfYear = courseObjects.findIndex((e) => e.academicYearStart == y.year)
            }
        }
    };
    console.log('Deleted ' + countDeleted + ' courses')
    console.log("Removed " + countRemoved + " courses with incorrect year from the incoming dataset.")

    // Send the new courses to the database
    console.log("Sending data to database...")
    await CourseSection.bulkSave(courseObjects as any)

    console.log("Successfully sent all courses.")
}

// Given a json object representing a course with the fields present in the data
// recieved from WPI, creates a CourseSection object
function createCourseSection(course: CourseListingsCourseSection, yearcounts: { year: number, count: number }[]): CourseSectionDocument {
    // PARSE NAME:
    // course.Course_Section is in format 'CS 4241-A01-X - Webware'
    // Split on hyphen surrounded by spaces to get 'CS 4241-A01-X', 'Webware'
    const sectionstring = course.Course_Section.split(' - ')

    // Split on hyphen to get 'CS 4241' 'A01' 'X'
    const courseCodeFull = sectionstring[0].split('-')
    const code = courseCodeFull[0]

    let section = courseCodeFull[1]
    // If there are additional parts to the section code, add them
    for (let i = 2; i < courseCodeFull.length; i++) {
        section += '-' + courseCodeFull[i]
    }

    let name = sectionstring[1]
    // Name might have ' - ' in it: if so, add extra pieces back
    for (let i = 2; i < sectionstring.length; i++) {
        name += ' - ' + sectionstring[i]
    }

    // FIND FULL ACADEMIC YEAR:
    let termLetter = course.Starting_Academic_Period_Type.charAt(0)
    // Add number to "E1" or "E2"
    if (termLetter == 'E') {
        termLetter += course.Starting_Academic_Period_Type.charAt(1)
    }
    // Convert "Summer" to "E"
    if (course.Starting_Academic_Period_Type == 'Summer') {
        termLetter == 'E'
    }
    let startYear = Number(course.Offering_Period.substring(0, 4))
    let endYear = startYear + 1
    if (termLetter != 'A' && termLetter != 'B' && termLetter != 'F') {
        // termletter == C, D, E, S, G
        startYear--
        endYear--
    }

    // Add the year of this item to the year counts
    const yearIndex = yearcounts.findIndex((e) => e.year == startYear)
    if (yearIndex !== -1) {
        yearcounts[yearIndex].count++
    }
    else {
        yearcounts.push({ year: startYear, count: 1 })
    }

    const meetingPatterns: CourseMeetingPattern[] = [];
    course.Section_Details.split(";").forEach(meeting => {
        const parts = meeting.split(" | ");
        // This should be three or four items: the location, the days, the time range, and optionally the date range

        const weekdayLetters = ['M', 'T', 'W', 'R', 'F', 'S', 'U']
        const meetingDays: number[] = []
        // If the class is asynchronous, no meeting days
        if (parts[1] && parts[1] !== "Online-asynchronous") {
            // Otherwise, check for each day and push the corresponding number
            weekdayLetters.forEach((letter, number) => {
                if (parts[1].includes(letter)) {
                    meetingDays.push(number)
                }
            });
        }

        let startDate = new Date(parts[3] ? parts[3].split(" - ")[0] : course.Course_Section_Start_Date);
        startDate = new Date(startDate.toLocaleString("en-US", {timeZone: "America/New_York"}));
        let endDate = new Date(parts[3] ? parts[3].split(" - ")[1] : course.Course_Section_End_Date);
        endDate = new Date(endDate.toLocaleString("en-US", {timeZone: "America/New_York"}));

        // Add each meeting day
        meetingDays.forEach(day => {
            const startDateDay = new Date(startDate);
            const endDateDay = new Date(endDate);

            meetingPatterns.push({
                day: day,
                startTime: timeToMinutesPastMidnight(parts[2].split(" - ")[0]),
                endTime: timeToMinutesPastMidnight(parts[2].split(" - ")[1]),
                startDate: startDateDay.getTime(),
                endDate: endDateDay.getTime(),
                location: parts[0].trim()
            })
        })
    });

    // MAKE EVERYTHING INTO AN OBJECT
    const courseObject = new CourseSection({
        name: name,
        code: code,
        type: course.Instructional_Format,
        section: section,
        term: termLetter,
        academicYearStart: startYear,
        academicYearEnd: endYear,
        meetings: meetingPatterns,
        professors: course.Instructors.split('; ')
    });
    return courseObject
}

// Given a 12h time formatted as a string, e.g. "9:20 AM", returns the time as
// minutes from midnight
function timeToMinutesPastMidnight(timestring: string) {
    const parts = timestring.split(':')
    const hour = Number(parts[0])
    const mins = Number(parts[1].substring(0, 2))
    const meridian = parts[1].substring(3)
    let time = hour * 60 + mins
    if (meridian == 'PM' && hour != 12) {
        time += 12 * 60
    }
    return time
}