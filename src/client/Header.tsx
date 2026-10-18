import { useSignal } from "@preact/signals"
import * as Types from "../shared/types";
import { UploadDialog } from "./UploadDialog"

export function Header(props: { 
    loggedIn: boolean,
    sections: Types.CourseSection[],
    setSections: (sections: Types.CourseSection[]) => void,
    setAcademicYear: (year: number) => void,
    setUser: (user: string | null) => void,
    setIsCourses: (isCourses: boolean) => void,
    loadIndex: () => void,
    loadLogin: () => void
}) {
    const showUpload = useSignal<() => void>(() => {});
        
    // Sends a logout request to the server
    const handleLogout = async(event : Event) =>{
        event.preventDefault()
        fetch( '/api/log-out', {
      		method:'POST',
      		headers: { 'Content-Type': 'application/json' }
    	}).then(response => response.json())
    		.then(json => {
      		props.setUser(null)
    	})	
        props.setSections([])
        props.setIsCourses(false)
    }

    return <>
        <UploadDialog sections={props.sections} setAcademicYear={props.setAcademicYear} setSections={props.setSections} loadIndex={props.loadIndex} setIsCourses={props.setIsCourses} show={showUpload} />
        <header>
            <button class='title' type='button' onClick={props.loadIndex}>WPI Schedule Viewer</button>
            <button onClick={() => {
                showUpload.value();
            }}>Upload Schedule</button>
            {props.loggedIn
                ? <><form onSubmit={handleLogout}>
                        <button type='submit'>Log Out</button>
                    </form></>
                : <button type='button' onClick={props.loadLogin}>Log In</button>
            }
        </header>
    </>
}