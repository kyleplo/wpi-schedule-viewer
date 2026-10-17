import express from "express"
import { CourseSection, User } from "./models.js"
import busboy from "busboy";
import { parseXLSX } from "./xlsxHandler.js";
import { getUserByToken } from "./auth.js";
import * as Types from "../shared/types.js";

export function courseRoutes(app: express.Express) {
    app.get("/api/courses/:user", async (req, res) => {
        const user = await User.findById(req.params.user);

        if (!user) {
            res.status(404).json({
                error: "User not found"
            });
            return;
        }

        if (!user.courses.length) {
            res.status(200).json([]);
            return;
        }

        const courseSections = await getCourseSections(user.courses);

        res.status(200).json(courseSections);
    });

    // Handles receiving the .xlsx file from the user
    app.post("/api/courses", (req: express.Request, res: express.Response) => {
        const bb = busboy({ headers: req.headers, });
        let userCourses: Types.CourseDBTuple[];
        bb.on('file', async (name, file, info) => {
            const { filename, encoding, mimeType } = info;
            if (mimeType != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                res.status(400).json({
                    error: `Invalid Excel file`
                });
                return;
            }
            userCourses = await parseXLSX(file);
            if (!userCourses.length) {
                res.status(400).json({
                    error: `Unable to parse courses in provided file`
                });
                return;
            }
            const user = await getUserByToken(req.session?.token);
            if (!user) {
                const courseSections = await getCourseSections(userCourses);
                res.json(courseSections);
                return;
            }else{
                const terms = userCourses.map(course => course.section[0] + course.academicYear);
                const newCourses: Types.CourseDBTuple[] = user.courses.filter(course => !terms.includes(course.section[0] + course.academicYear)).concat(userCourses as any[]);
                user.set('courses', newCourses);
                await user.save()
                const courseSections = await getCourseSections(user.courses);
                res.json(courseSections);
            }
        });

        bb.on('close', () => {});
        req.pipe(bb);
    });
}

export async function getCourseSections(courses: Types.CourseDBTuple[]): Promise<Types.CourseSection[]> {
    return await CourseSection.find({
        $or: courses.map(course => {
            return {
                code: course.code as any,
                section: course.section as any,
                academicYearStart: course.academicYear as any
            }
        })
    })
}