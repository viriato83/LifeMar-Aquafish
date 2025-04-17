import { useEffect } from "react"
import logo from "../logo_lifemar.png"
export default function Header(){
    function Sair(){
        sessionStorage.clear()
        window.location.reload()
    }
    useEffect(() => {
         if(sessionStorage.getItem("token")==null){
            sessionStorage.clear()
            window.location.reload()
         }
        }
 ,[])
    return (<>
      <header className="header">
        <div className="usuario">
            {sessionStorage.getItem("login")}
        </div>
        <div className="logo">
        <img src={logo} alt="Logo" width="130px" />
        </div>
        <h1>LifeMar </h1>
        <button className="sair" onClick={(Sair)}>Sair</button>
    </header>
    </>)
}