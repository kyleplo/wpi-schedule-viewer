import * as Types from "../shared/types.js";
import { formatTime } from "../shared/util";
import { days } from "./Schedule.jsx";

export function ScheduleList (props: {
    sections: Types.CourseSection[],
    removeCourse?: false | ((section: Types.CourseSection) => void)
}) {
    const courseColors = new Map<string, number>();
    let lastCourseColor = 0;

    return <ul class="schedule-list">
        {props.sections.map(section => {
            let courseColor;
            if (courseColors.has(section.code)) {
                courseColor = courseColors.get(section.code);
            } else {
                courseColor = lastCourseColor;
                courseColors.set(section.code, courseColor);
                lastCourseColor++;
            }

            return <li class={"course" + courseColor}>
                <p>{section.code}-{section.section} {section.name} {section.type} {section.professors.join("").length > 0 && "with " + section.professors.join(", ")}</p>
                <ul>
                    {section.meetings.map(meeting => <li>
                        {days[meeting.day]}s&nbsp;
                        {formatTime(meeting.startTime)}-{formatTime(meeting.endTime)}&nbsp;
                        {new Date(meeting.startDate).toLocaleDateString()}-{new Date(meeting.endDate + 86400000).toLocaleDateString()}&nbsp;
                        {meeting.location && "in " + meeting.location}
                    </li>)}
                </ul>
                { props.removeCourse && <button onClick={() => {
                    (props.removeCourse as (section: Types.CourseSection) => void)(section);
                    fetch(`/api/courses/?code=${section.code}&section=${section.section}&academicYear=${section.academicYearStart}`, {
                        method: "DELETE"
                    });
                }}>Remove</button> }
            </li>
        })}
    </ul>
}