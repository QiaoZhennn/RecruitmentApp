import React from 'react'
import {Route, Switch} from 'react-router-dom';
import BossInfo from "./container/bossinfo/bossinfo";
import Login from "./container/login/login";
import Dashboard from "./component/dashboard/dashboard";
import GeniusInfo from "./container/geniusinfo/geniusinfo";
import Register from "./container/register/register";
import Chat from "./component/chat/chat";

class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false
        }
    }

    //当渲染组件出错时，调用这个函数
    componentDidCatch(err, info) {
        // console.log(err, info)
        this.setState({
            hasError: true
        })
    }

    render() {
        return this.state.hasError
            ? <div>
                <h2>Something goes wrong!</h2>
                <img className={'error-container'} src={require('./404_page_cover.jpg')} alt={""}/>
            </div>
            : (
                <div>
                    <Switch>
                        <Route path={'/bossinfo'} component={BossInfo}/>
                        <Route path={'/geniusinfo'} component={GeniusInfo}/>
                        <Route path={'/register'} component={Register}/>
                        <Route path={'/login'} component={Login}/>

                        <Route path={'/chat/:user'} component={Chat}/>
                        {/*没有任何命中，就跳转到Dashboard*/}
                        <Route component={Dashboard}/>
                    </Switch>
                </div>
            )
    }
}

export default App