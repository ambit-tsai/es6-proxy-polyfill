import {
    Global,
} from './constants';
import Proxy from './Proxy';
import './intercept';



if (!Global.Proxy) {
    Global.Proxy = Proxy;
}
