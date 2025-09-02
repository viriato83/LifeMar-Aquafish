import React from 'react'
import Conteinner from './Conteinner'

const Error = () => {
  return (
    <Conteinner>
        <div className='d-flex justify-content-center   align-items-center m-auto  text-danger'>
         <div  className='d-flex  align-items-center justify-content-center  flex-column  text-danger ' style={{fontSize:"50px"}} >
            <p>⚠️</p>
         <p>Sistema atualmente indisponivel </p>
       <p>Por favor, contacte o adiministrador </p>
        </div>
       
    </div>
    </Conteinner>
  )
}

export default Error
