import React from 'react';
import CreateOrJoinForm from './components/CreateOrJoinForm/CreateOrJoinForm'

const RoomPage = () => {
    return (
        <div className='container  mx-auto min-h-screen flex justify-center items-center'>
            <div
                className=' rounded-xl border gap-2 flex-col flex border-gray/100 px-8 py-4'>
             <h1>
                  Whats next?
             </h1>
                <CreateOrJoinForm/>
            </div>
        </div>
    );
};

export default RoomPage;
