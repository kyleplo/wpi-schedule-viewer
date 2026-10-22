import { load } from "cheerio"
import { altDay } from "../shared/types.js"
import { AlternateDate, AlternateDateDocument } from "./models.js"

export async function fetchCalenderData(){
    //extract the last two digits from the year
    let year: number =  new Date().getFullYear() % 2000
    let url = `https://www.wpi.edu/academics/calendar/${year}-${year+1}`
    console.log(url)
    const response = await fetch(url, {
        headers : {"User-Agent" : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0'}
    })
    console.log(response.status)
    const page: string = await response.text()
    //console.log(`page${page}`)
    //loads the html into the cheerio DOM
    const altDays : altDay[]= []
    const daysOff: Date[] = []
    let $ = load(page)
    let tables = $('table')
    const monthMaps : Record<string, number> = {
        "January" : 0, "February" : 1, "March" : 2, "April" : 3, 
        "May" : 4, "June" : 5, "July" : 6, "August" : 7,
        "September" : 8, "October" : 9, "November" : 10, "December" : 11
    }
    enum Days {
        "Monday" = "M",
        "Tuesday" = "T",
        "Wednesday" = "W",
        "Thursday" = "R",
        "Friday" = "F"
    }
    year = year + 2000;
    tables.each((i, table) => {
        //each table is preceded by an h5 with the month name 
        const month = $(table).prev().text()
        const monthIndex: number = monthMaps[month]
        if (monthIndex === 0){
            year = year+1
        } 
        $(table).find('tr').each((r, row) =>{
            const dateDescription = $(row).last().text()
            if(dateDescription.toLowerCase().includes("no classes")){
                const day = $(row).first().text();
                daysOff.push(new Date(year, monthIndex, parseInt(day)))
            }
            if(dateDescription.includes("Follow")){
                const day = $(row).first().text();
                let schedule = ""
                Object.entries(Days).forEach(([weekday, abbreviation]) => {
                    if (dateDescription.includes(weekday)){
                        schedule = abbreviation
                    }
                });
                altDays.push({"date" : new Date(year, monthIndex, parseInt(day)), "schedule" : schedule})
            }
        })
    })
    const dateObjects : AlternateDateDocument [] = []

    daysOff.forEach((day) =>{
        const dateObject =  new AlternateDate({date : day})
        dateObjects.push(dateObject)
    })
    altDays.forEach((day) =>{
        const dateObject =  new AlternateDate({
            date : day.date,
            schedule : day.schedule})
        dateObjects.push(dateObject)
    })
    await AlternateDate.bulkSave(dateObjects as any)
}