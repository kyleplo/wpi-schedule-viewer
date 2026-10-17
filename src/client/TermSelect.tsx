import * as Types from "../shared/types";

const terms: Record<Types.Term, string> = {
    A: "A term",
    B: "B term",
    F: "Fall Semester",
    C: "C term",
    D: "D term",
    S: "Spring Semester",
    G: "Graduate Spring Late Start",
    E1: "E1 term",
    E2: "E2 term",
    E: "Summer term"
}

export function TermSelect(props:{
        setTerm: (term: Types.Term) => void
        term: Types.Term
}){
    return <>
        <select class="centered" name="TermSelect" aria-label="Select the term" 
        onChange={e => props.setTerm((e.target as HTMLSelectElement).value as Types.Term)}>
            {Object.entries(terms).map(term => {
                return <option value={term[0]} selected={term[0] === props.term} key={term[0]}>{term[1]}</option>
            })}
        </select>
    </>
}