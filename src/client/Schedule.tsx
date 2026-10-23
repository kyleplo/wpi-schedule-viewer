import { CourseSection } from "../shared/types"
import { mostExtremeTimes, formatTime } from "../shared/util"

export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function Schedule(props: {sections: CourseSection[]}) {
    const extremes = mostExtremeTimes(props.sections);
    const hours: number[] = [];
    for (let h = Math.floor(extremes.earliest / 60); h < Math.ceil(extremes.latest / 60); h++) {
        hours.push(h);
    }

    const courseColors = new Map<string, number>();
    let lastCourseColor = 0;

    return <div class="schedule">
        <div class="header-stripe"></div>
        {hours.map((hour, hourIndex) => {
            return <>
                {hourIndex % 2 == 1 ? <div class="time-stripe" style={{
                    gridRow: timeToRow(hour * 60, extremes.earliest) + " / " + timeToRow((hour + 1) * 60, extremes.earliest),
                    gridColumn: "1 / 7"
                }}></div> : null}
                <div class="time-label" style={{
                    gridRow: timeToRow(hour * 60, extremes.earliest) + " / " + timeToRow((hour + 1) * 60, extremes.earliest),
                    gridColumn: 1
                }}>
                    {formatTime(hour * 60)}
                </div>
            </>
        })}
        {days.map((day, dayIndex) => {
            return <div class="day-label" style={{
                gridRow: 1,
                gridColumn: dayIndex + 2
            }}>
                {day}
            </div>
        })}
        {props.sections.map(section => {
            let courseColor;
            if (courseColors.has(section.code)) {
                courseColor = courseColors.get(section.code);
            } else {
                courseColor = lastCourseColor;
                courseColors.set(section.code, courseColor);
                lastCourseColor++;
            }

            const cssclass = "course-section course" + courseColor
            return <>
                {section.meetings.map(meeting => {
                    return <div class={cssclass} style={{
                        gridRow: timeToRow(meeting.startTime, extremes.earliest) + " / " + timeToRow(meeting.endTime, extremes.earliest),
                        gridColumn: meeting.day + 2
                    }}>
                        <p>{section.code}-{section.section}</p>
                        <p>{section.name}</p>
                        <p>{meeting.location}</p>
                        <p>{section.professors.join(", ")}</p>
                        <p>{section.type}</p>
                    </div>
                })}
            </>
        })}
    </div>
}

function timeToRow(time: number, earliest: number): number {
    return Math.floor((time - earliest) / 5) + 2
}