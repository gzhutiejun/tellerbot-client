import { useState } from 'react'
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
        


function App() {
  const [value, setValue] = useState('');
  return (

    <div>
        
        <InputText value={value} onChange={(e) => setValue(e.target.value)} />
        <Password value={value} onChange={(e) => setValue(e.target.value)} feedback={false} tabIndex={1} />
    </div>
  )
}

export default App
