import { useSignal } from "@preact/signals";
import { useRef, useState, useEffect } from "preact/hooks";
export function ShareDialog(props : {user:string}){
    //get the website name
    const link = `${window.location.origin}/user/${props.user}`;
    const dialogRef = useRef<HTMLDialogElement>(null);
    const timerId = useSignal<number |undefined | null>(null)
    const [isCopied, setCopied] = useState(false)
    const copyLink = async ()=>{
        try{
            await navigator.clipboard.writeText(link);
            setCopied(true)
        }catch(error:unknown){}
    }

    useEffect(() =>{
        if(isCopied){
            if (timerId.value) clearTimeout(timerId.value);
            timerId.value = setTimeout(()=>{
                setCopied(false)
            }, 5000)
        }
        return () =>{
            if (timerId.value) clearTimeout(timerId.value);
        }
    },[isCopied])
    const openDialog = () =>{
        dialogRef.current?.showModal();
    }
    const closeDialog = ()=>{
        dialogRef.current?.close();
    }
    return (<>
            <button onClick={openDialog}>Share Schedule</button>
            <dialog ref={dialogRef} id='share'>
                <div class="flex">
                    <div>
                        <p>Want to share your schedule with other users? Copy or share this link.</p>
                    </div>
                    <button class="close-button" onClick={closeDialog}>X</button>
                    </div>
                <input type='text' name="copyLink" readonly value={link}/> 
                {isCopied ? <button class='copied' onClick={copyLink}>Copied</button>
                    : <button onClick={copyLink}>Copy</button>}
                <button onClick={() => {
                    navigator.share({
                        title: "WPI Schedule",
                        url: link
                    })
                }}>Share</button>
            </dialog>
        </>)
}