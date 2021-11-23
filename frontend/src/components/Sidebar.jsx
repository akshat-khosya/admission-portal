import React, { useState } from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import { SidebarData } from "./SideMenuData";

function Sidebar(props) {
  let headings=["Personal Details","Academic Details","Files"];
  const [sidebar, setSidebar] = useState(
    window.innerWidth > 900 ? true : false
  );
  const[heading,setHeading]=useState("Personal Details");
function changeHeading(index){
 if(index<=props.rest){
  setHeading(headings[index]);
 }
  
}
  const showSidebar = () => setSidebar(!sidebar);

  return (
    <>
      
      <div className="sidebar">
        {window.innerWidth < 900 && (
          <a className="menu-bars">
            <FaIcons.FaBars onClick={showSidebar} />
          </a>
        )}
        <h1 className="sidebar-heading">{heading}</h1>
        <nav className={sidebar ? "nav-menu active" : "nav-menu"}>
          <ul className="nav-menu-items" >
            {window.innerWidth < 900 && (
              <li className="sidebar-toggle">
                <a className="menu-bars" onClick={showSidebar}>
                  <AiIcons.AiOutlineClose />
                </a>
              </li>
            )}

            {SidebarData.map((item, index) => {
              return (
                <li key={index} className={item.cName}>
                  <span>
                   {item.icon} 
                    <span onClick={()=>{changeHeading(index);props.GoTo(index)}}>{item.title}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      
    </>
  );
}

export default Sidebar;
