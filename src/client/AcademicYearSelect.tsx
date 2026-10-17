export function AcademicYearSelect(props: {
    setYear: (year: number) => void,
    years: number[],
    year: number
}) {
    return <select name="AcademicYearSelect" 
        aria-label="Select the Academic Year" 
        onChange={e => props.setYear(parseInt((e.target as HTMLSelectElement).value))}>
            {props.years.map((year)=>(
                <option value={year} key={year} selected={props.year === year}>{year}-{year+1}</option>
            ))}
        </select>
}