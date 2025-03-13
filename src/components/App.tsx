import Avatar from "./Avatar";
import Dialog from "./Dialog";
import Mic from "./Mic";

function App() {

  return (
    <div className={"acc-screen"}>
      <div className="acc-header">
        <div className="acc-logo"></div>
      </div>

      <div className="acc-body">
        <div className="avatar">
          <Avatar></Avatar>
        </div>

        <div className="dialog">
          <Dialog></Dialog>
          <Mic></Mic>
        </div>
      </div>
    </div>
  );
}

export default App;
