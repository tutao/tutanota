package de.tutao.tutanota;

import org.json.JSONObject;
import org.junit.Test;

import static org.junit.Assert.assertEquals;


public class JSONObjectTest {
    @Test
    public void escaping() throws Exception {
        JSONObject o = new JSONObject();
        o.put("dummy", "\t escape tab");
        assertEquals("{\"dummy\":\"\\t escape tab\"}", o.toString());
    }

    @Test
    public void escape2(){
        String r = "\"".replace("\"", "\\\""); // we need a double escaping for quotes as simple escapes are lost when returning to
    }

}