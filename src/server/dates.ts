import express from "express"
import { AlternateDate, AlternateDateDocument } from "./models.js"
import { AltDay } from "../shared/types.js"
export function dateRoutes(app: express.Express) {
    app.get("/api/dates/", async (req, res) => {
        const dates : AlternateDateDocument[] =  await AlternateDate.find()
        const datesExcluded : Date[] = []
        const altScheduleDates : AltDay[] = []
        if (!dates.length) {
            res.status(200).json({"datesExcluded" : [], "altSchedule" : []});
            return;
        }else{
            dates.forEach((day) => {
                if(day.schedule !== null && day.schedule!== undefined){
                    altScheduleDates.push({"date" : day.date, "schedule" : day.schedule})
                }
                //still wanna remove the date from the regular weekly repition if an alternate schedule
                datesExcluded.push(day.date)
                //console.log(day)
            })
        }
        console.log(altScheduleDates)
        res.status(200).json({ "datesExcluded" : datesExcluded, "altSchedules" : altScheduleDates });
    })
}