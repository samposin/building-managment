const RequestItem = (props) => {
  const { email, first_name, last_name, user_type, message, name, type, doors } = props.request;
    return (<>
            <div className="row">
          <div className="col-sm-5 text-muted text-right">
            Form
          </div>
          <div className="col-sm-7 text-white">
            { first_name + " " + last_name }
          </div>
        </div>
        <div className="row mt-1">
          <div className="col-sm-5 text-muted text-right">
            User Type
          </div>
          <div className="col-sm-7 text-white">
            { user_type }
          </div>
        </div>
        <div className="row mt-1">
          <div className="col-sm-5 text-muted text-right">
            Building
          </div>
          <div className="col-sm-7 text-white">
            { name }
          </div>
        </div>
        <div className="row mt-1">
          <div className="col-sm-5 text-muted text-right">
            Door(s)
          </div>
          <div className="col-sm-7 text-white">
            { doors }
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-sm-6">
            <button type="button" className="btn btn-outline-danger">Dismiss</button>
          </div>
          <div className="col-sm-6">
            <button type="button" className="btn btn-outline-primary" onClick={() => (props.setRequest(props.request) )}>View</button>
          </div>
        </div>
        <br />
        <hr />
    </>);
}
 
export default RequestItem;