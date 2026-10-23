import ical, { ICalEventRepeatingFreq } from "ical-generator";
import { AltDay, CourseSection } from "../shared/types.js";

export async function exportIcal(sections: CourseSection[]) {
    const calendar = ical({
        name: "WPI Schedule",
        timezone: "America/New_York"
    });
    
    const response = await fetch('/api/dates/', {
      	headers: { 'Content-Type': 'application/json' }
    })
    const json =  await response.json()
    const datesExcluded : Date[] = json.datesExcluded
    //apparently dates are converted to strings over http which i guess makes sense
    const altScheduleDates : AltDay[] = json.altSchedules.map((day: any) => ({
        ...day,
        date: new Date(day.date)
    }));
    console.log(altScheduleDates)
    sections.forEach(section => {
        section.meetings.forEach(meeting => {
            const start = new Date(meeting.startDate);
            start.setHours(Math.floor(meeting.startTime / 60), meeting.startTime % 60);
            const end = new Date(meeting.startDate);
            end.setHours(Math.floor(meeting.endTime / 60), meeting.endTime % 60);
            while (start.getDay() !== (meeting.day + 8) % 7) {
                start.setDate(start.getDate() + 1);
            }
            while (end.getDay() !== (meeting.day + 8) % 7) {
                end.setDate(end.getDate() + 1);
            }
            const termEnd = new Date(meeting.endDate + 86400000);
            end.setHours(Math.floor(meeting.endTime / 60), meeting.endTime % 60);
            calendar.createEvent({
                start: start,
                end: end,
                description: section.name + (section.professors.join("").length > 0 ? " with " + section.professors.join(", ") : ""),
                summary: section.code + "-" + section.section + " " + section.type,
                location: meeting.location,
                repeating: {
                    freq: ICalEventRepeatingFreq.WEEKLY,
                    until: termEnd,
                    exclude : datesExcluded,
                }
            })
            console.log(termEnd)
            console.log(start)
            //gets just the alt schedule days for the term the section is for
            
            const filteredDates : AltDay[] = altScheduleDates.filter(day => day.date <=termEnd && day.date >= new Date(meeting.startDate))

            console.log(`filtered dates length: ${filteredDates.length}`)
            filteredDates.forEach(altDay =>{
                if(altDay.schedule == meeting.day){
                    const altStart = new Date(altDay.date)
                    const altEnd = new Date(altDay.date)
                    altStart.setHours(Math.floor(meeting.endTime / 60), meeting.endTime % 60);
                    altEnd.setHours(Math.floor(meeting.endTime / 60), meeting.endTime % 60);
                    calendar.createEvent({
                        start: altStart,
                        end: altEnd,
                        description: section.name + (section.professors.join("").length > 0 ? " with " + section.professors.join(", ") : ""),
                        summary: section.code + "-" + section.section + " " + section.type,
                        location: meeting.location
                    })
                }
            }); 
        });
    });
    

    const blob = new Blob([calendar.toString()], {
        type: "text/calendar"
    });
    const blobUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("A");
    downloadLink.setAttribute("href", blobUrl);
    downloadLink.setAttribute("download", "schedule.ics");
    downloadLink.click();
}