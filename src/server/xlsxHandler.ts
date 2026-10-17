import XLSX from "xlsx";
import { buffer } from "stream/consumers"
import Stream from "stream"
import { CourseDBTuple } from "../shared/types.js";

/**
 * 
 * @param file readable stream returned as file from busboy library
 * @returns promise containing an array of Objects representing the user's courses
 */
export async function parseXLSX(file: Stream.Readable): Promise<CourseDBTuple[]> {
    const workbook = XLSX.read(await buffer(file), { dense: true, nodim: true });
    const sheet1 = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet1, { header: 1 }); //sheet1["!data"]?.map((row) => row.map((cell) => cell.v));

    let sectionIndex = -1;
    let periodIndex = -1;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        if (!row) {
            break;
        }

        if ((row.includes("Section") || row.includes("Course Section Definition")) && (row.includes("Academic Period") || row.includes("Course Listing"))) {
            sectionIndex = Math.max(row.indexOf("Section"), row.indexOf("Course Section Definition"));
            periodIndex = Math.max(row.indexOf("Academic Period"), row.indexOf("Course Listing") - 1)
            break;
        }
    }

    if (sectionIndex === -1 || periodIndex === -1) {
        return [];
    }

    const userCourses: CourseDBTuple[] = []

    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        if (!row) {
            break;
        }

        if (!row[sectionIndex] || !row[periodIndex]) {
            continue;
        }

        const sectionSplit = row[sectionIndex].split("-");

        if (sectionSplit.length < 2) {
            continue;
        }

        const firstSemester = sectionSplit[1][0] === "A" || sectionSplit[1][0] === "B" || sectionSplit[1][0] === "F";
        const period = row[periodIndex].split(" - ");
        const year = parseInt(period[period.length - 1]);

        if (sectionSplit[0].length < 6 || sectionSplit[1].trim().length < 2 || isNaN(year)) {
            continue;
        }

        userCourses.push({
            code: sectionSplit[0],
            section: sectionSplit[1].trim().split("/")[0],
            academicYear: firstSemester ? year : year - 1
        })
    }

    return userCourses;
}