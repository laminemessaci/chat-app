import React, { useRef, useEffect, useState } from 'react';
import "./middle.css";
import blackSearch from "../../../../png/blackSearch.png";
import limeSearch from "../../../../png/limeSearch.png";
import { useSelector } from 'react-redux';
import removeUser from './removeUser';

function AvailableChat() {
  const [data, setData] = useState(null);
  const con = useRef(null);
  const img = useRef(null);

  const allUsersData = useSelector(state => state.user.allUsersData);
  const userData = useSelector(state => state.user.userData);

  // const splice = removeUser(allUsersData.data, userData.data._id);
  // setData(splice);
  // console.log(splice);


  useEffect(() => {
    // changing images on hover
    con.current.addEventListener("mouseenter", (e) => {
      img.current.src = limeSearch;
    });

    con.current.addEventListener("mouseleave", (e) => {
      img.current.src = blackSearch;
    });
    // if (allUsersData.data && userData.data._id) {
    //   const splice = removeUser(allUsersData.data, userData.data._id);
    //   setData(splice);
    //   console.log(splice);
    // }
  }, []);

  useEffect(() => {
    const splice = removeUser(allUsersData.data, userData.data._id);
    setData(splice);
  }, [allUsersData.data, userData.data]);

  return (
    <div className='chat-comp'>
      <div>Available Chat</div>
      <div ref={con} className="search">
        <img ref={img} src={blackSearch} alt='search' />
        <input type='search' placeholder='Search Chat' />
      </div>
      <div className='chat-list'>
        {allUsersData.isLoading && <div>Loading...</div>}
        {allUsersData.isFailed && <div>some internal server error occurred</div>}
        <ul>
          {data && data.map(data => {
            const { name, about, avatar, image, _id } = data;
            return (
              <li key={_id}>
                <span className='profile-img' style={{ background: avatar }}>
                  {image ? <img src={image} alt='profile' /> : name.slice(0, 2)}
                </span>
                <span className='name-msg'>
                  <div className='name'>{name}</div>
                  <div className='last-msg'>{about ? about : "Hello there. I'm using chat-app"}</div>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AvailableChat;