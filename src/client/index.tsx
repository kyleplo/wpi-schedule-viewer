import { render } from "preact"
import { useEffect, useState } from "preact/hooks";
import { exportScheduleImage } from "./exportScheduleImage.js"
import { exportIcal } from "./exportIcal.js"
import { Schedule } from "./Schedule.js";
import { AuthForm } from "./AuthForm.js"
import * as Types from "../shared/types.js";
import { Header } from "./Header.js";
import { filterCourseSections } from "../shared/util"
import { ShareDialog } from "./ShareDialog.jsx";
import { TermSelect } from "./TermSelect.js"
import { AcademicYearSelect } from "./AcademicYearSelect.jsx";

function getAcademicYearAndTerm(): { year: number, term: Types.Term } {
    const date = new Date();
    
    switch (date.getMonth()) {
        case 0: // January
        case 1: // February
            return { year: date.getFullYear() - 1, term: "C" }
        case 2: // March
            if (date.getDate() < 10) {
                return { year: date.getFullYear() - 1, term: "C" }
            } else {
                return { year: date.getFullYear() - 1, term: "D" }
            }
        case 3: // April
            return { year: date.getFullYear() - 1, term: "D" }
        case 4: // May
            if (date.getDate() < 15) {
                return { year: date.getFullYear() - 1, term: "D" }
            } else {
                return { year: date.getFullYear() - 1, term: "E1" }
            }
        case 5: // June
            return { year: date.getFullYear() - 1, term: "E1" }
        case 6: // July
            return { year: date.getFullYear() - 1, term: "E2" }
        case 7: // August
            if (date.getDate() < 15) {
                return { year: date.getFullYear() - 1, term: "E2" }
            } else {
                return { year: date.getFullYear(), term: "A" }
            }
        case 8: // September
            return { year: date.getFullYear(), term: "A" }
        case 9: // October
            if (date.getDate() < 15) {
                return { year: date.getFullYear(), term: "A" }
            } else {
                return { year: date.getFullYear(), term: "B" }
            }
        case 10: // November
        default: // December
            return { year: date.getFullYear(), term: "B" }
    }
}

function App() {

    // To add another page, add its name to the Page enum and logic to the page
    // handling section below. To switch to the page, update useState to the
    // enum value
    enum Page{Index, Login, SignUp, Shared}
    const [page, setPage] = useState(Page.Index)
    const [term, setTerm] = useState<Types.Term>(getAcademicYearAndTerm().term);
    const [user, setUser] = useState<string |null>(null);
    //seperate useState to show another person's schdule, so it can work regardless of login status
    const [sharedUser, setSharedUser] = useState<string |null>(null);
    const [academicYear, setAcademicYear] = useState(getAcademicYearAndTerm().year);
    const [years, setYears] = useState([academicYear])
    //sections cross all years and terms
    const [sections, setSections] = useState<Types.CourseSection[]>([]);
    const [filteredSections, setFilteredSections] = useState<Types.CourseSection[]>([]);
    const [isCourses, setIsCourses] = useState(false)

    // This function can be passed down to components and set as an onclick
    // function for buttons which go to the index page
    function loadIndex(): void {
        setPage(Page.Index)
        history.pushState({}, "", "/")
        if (sharedUser) setSharedUser(null)
    }

    // This function can be passed down to components and set as an onclick
    // function for buttons which go to the login page
    function loadLogin(): void {
        history.replaceState({}, "", "/");
        setPage(Page.Login)
    }

    // This function can be passed down to components and set as an onclick
    // function for buttons which go to the account creation page
    function loadSignUp(): void{
        history.replaceState({}, "", "/");
        setPage(Page.SignUp)
    }

    const setPageWithUrl =()=>{
        //produces the following array: [ "", "user", "6ac6e94ce0690abe701ae14a" ] or [""]
        const pathArray: string[] = window.location.pathname.split("/")
        if(pathArray.length === 3 && pathArray[1] == 'user'){
            setPage(Page.Shared)
            setSharedUser(pathArray[2])
        }
        else{
            setPage(Page.Index)
            setSharedUser(null)
        }

    }
    //use effect to parse the url
    useEffect(()=>{
        setPageWithUrl();
        window.addEventListener('popstate', setPageWithUrl)
        return () => window.removeEventListener("popstate", setPageWithUrl);
    },[])

    useEffect(() => {
        const userToFetch =  sharedUser || user

        if (userToFetch) {
            fetch("/api/courses/" + userToFetch).then(r => {
            return r.json();
        }).then((sections: Types.CourseSection[]) => {
            setIsCourses(true)
            //setSections(filterCourseSections(sections, academicYear, term))
            sections.forEach(section => {
                if (!years.includes(section.academicYearStart)) {
                    setYears(years.concat([section.academicYearStart]).toSorted())
                }
            })
            setSections(sections)
        });
        }
    }, [user, sharedUser]);

    useEffect(()=>{
        setFilteredSections(filterCourseSections(sections, academicYear, term))
    },[sections, academicYear, term])

    //check login status on page load
    useEffect(() =>{
        fetch('/api/status')
        .then(res => res.json())
        .then(json => setUser(json.user))
    }, [])

    // -------------------------------------------------------------------------
    // PAGE HANDLING
    // This handles the logic for when to load pages and what to load
    // Most pages should have a <Header> and a <main> element
    // -------------------------------------------------------------------------
    if(!user && page == Page.Login){
        // Loads the login page only if the user is not logged in
        return <>
            <Header loggedIn={false} setUser={setUser} loadIndex={loadIndex} loadLogin={loadLogin} setAcademicYear={setAcademicYear} setSections={setSections} sections={sections} setIsCourses={setIsCourses} />
            <main>
                <AuthForm isLogin={true} onLogin={setUser} loadSignUp={loadSignUp} />
            </main>
        </>
    }
    else if(!user && page == Page.SignUp){
        // Loads the account creation page only if the user is not logged in
        return <>
            <Header loggedIn={false} setUser={setUser} loadIndex={loadIndex} loadLogin={loadLogin} setAcademicYear={setAcademicYear} setSections={setSections} sections={sections} setIsCourses={setIsCourses} />
            <main>
                <AuthForm isLogin={false} onLogin={setUser} loadLogin={loadLogin} />
            </main>
        </>
    }
    else if(page == Page.Shared){
        return <>
            <Header loggedIn={!!user} setUser={setUser} loadIndex={loadIndex} loadLogin={loadLogin} setAcademicYear={setAcademicYear} setSections={setSections} sections={sections} setIsCourses={setIsCourses} />
            <main>
                <div class="centered button-div">
                    <AcademicYearSelect setYear={setAcademicYear} years={years} year={academicYear} />
                    <TermSelect setTerm={setTerm} term={term} />
                </div>
                <div class="sidescroller">
                    <Schedule sections={filteredSections} />
                </div>
            </main>
        </>
    }
    else{
        // Otherwise loads the index page
        if(page != Page.Index){
            setPage(Page.Index)
            history.pushState({}, "", "/")
            if (sharedUser) setSharedUser(null)
        }
        
        return <>
            <Header loggedIn={!!user} setUser={setUser} loadIndex={loadIndex} loadLogin={loadLogin} setAcademicYear={setAcademicYear} setSections={setSections} sections={sections} setIsCourses={setIsCourses} />
            <main>
                {isCourses && <div class='centered button-div'>
                    <AcademicYearSelect setYear={setAcademicYear} years={years} year={academicYear} />
                    <TermSelect setTerm={setTerm} term={term} />
                </div>}
                
                <div class="sidescroller">
                    {filteredSections.length > 0
                        ? (user ? 
                            <Schedule sections={filteredSections} />
                            : <>
                                <p class='centered-text'>Log in to save your schedule.</p>
                                <Schedule sections={filteredSections}/>
                            </>)
                        : (sections.length > 0 ?
                            <p class="centered-text">Your schedule does not include any courses for this term. Try uploading a different schedule.</p> : 
                            <p class='centered-text'>Upload your schedule to view or share it.</p>
                        )
                    }
                </div>
                <div class='centered button-div'>
                    {filteredSections.length > 0 && <>
                        <button onClick={async () => {
                            await exportScheduleImage(filteredSections);
                        }}>Export Image</button>
                        <button onClick={() => {
                            exportIcal(filteredSections);
                        }}>Export for Calendar</button>
                        {user && <ShareDialog user={user}/>}
                    </>}
                </div>
            </main>
        </>
    }
}

render(<App />, document.body)