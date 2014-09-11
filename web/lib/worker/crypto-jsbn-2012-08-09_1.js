// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Basic JavaScript BN library - subset useful for RSA encryption.

// Bits per digit
var dbits;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary&0xffffff)==0xefcafe);

// (public) Constructor
// tutao: a = bitlength (1024)
//        b = number of miller rabin test * 2
//        c = SecureRandom
function BigInteger(a,b,c) {
  if(a != null)
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
}

// return new, unset BigInteger
function nbi() { return new BigInteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this[i++]+w[j]+c;
    c = Math.floor(v/0x4000000);
    w[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this[i]&0x7fff;
    var h = this[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this[i]&0x3fff;
    var h = this[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w[j++] = l&0xfffffff;
  }
  return c;
}
if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
  BigInteger.prototype.am = am2;
  dbits = 30;
}
else if(j_lm && (navigator.appName != "Netscape")) {
  BigInteger.prototype.am = am1;
  dbits = 26;
}
else { // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
BigInteger.prototype.DV = (1<<dbits);

var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this[0] = x;
  else if(x < -1) this[0] = x+DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { this.fromRadix(s,b); return; }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      this[this.t++] = x;
    else if(sh+k > this.DB) {
      this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
      this[this.t++] = (x>>(this.DB-sh));
    }
    else
      this[this.t-1] |= x<<sh;
    sh += k;
    if(sh >= this.DB) sh -= this.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    this.s = -1;
    if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
  }
  this.clamp();
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s&this.DM;
  while(this.t > 0 && this[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  if(this.s < 0) return "-"+this.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
  var p = this.DB-(i*this.DB)%k;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (this[i]&((1<<p)-1))<<(k-p);
        d |= this[--i]>>(p+=this.DB-k);
      }
      else {
        d = (this[i]>>(p-=k))&km;
        if(p <= 0) { p += this.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return (this.s<0)?-r:r;
  while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
  for(i = n-1; i >= 0; --i) r[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  for(var i = n; i < this.t; ++i) r[i-n] = this[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
  for(i = this.t-1; i >= 0; --i) {
    r[i+ds+1] = (this[i]>>cbs)|c;
    c = (this[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = this.t+ds+1;
  r.s = this.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  r.s = this.s;
  var ds = Math.floor(n/this.DB);
  if(ds >= this.t) { r.t = 0; return; }
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<bs)-1;
  r[0] = this[ds]>>bs;
  for(var i = ds+1; i < this.t; ++i) {
    r[i-ds-1] |= (this[i]&bm)<<cbs;
    r[i-ds] = this[i]>>bs;
  }
  if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
  r.t = this.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]-a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c -= a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c -= a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r[i++] = this.DV+c;
  else if(c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x[i],r,2*i,0,1);
    if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r[i+x.t] -= x.DV;
      r[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = this.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) this.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = this.s, ms = m.s;
  var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
  var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y);	// "negative" y so we can replace sub with am later
  while(y.t < ys) y[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
    if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
  if(ts < 0) BigInteger.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if(this.t < 1) return 0;
  var x = this[0];
  if((x&1) == 0) return 0;
  var y = x&3;		// y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while(x.t <= this.mt2)	// pad x so am has enough room later
    x[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;

// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);

// Copyright (c) 2005-2009  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Extended JavaScript BN functions, required for RSA private ops.

// Version 1.1: new BigInteger("0", 10) returns "proper" zero
// Version 1.2: square() API, isProbablePrime fix

// (public)
function bnClone() { var r = nbi(); this.copyTo(r); return r; }

// (public) return value as integer
function bnIntValue() {
  if(this.s < 0) {
    if(this.t == 1) return this[0]-this.DV;
    else if(this.t == 0) return -1;
  }
  else if(this.t == 1) return this[0];
  else if(this.t == 0) return 0;
  // assumes 16 < DB < 32
  return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
}

// (public) return value as byte
function bnByteValue() { return (this.t==0)?this.s:(this[0]<<24)>>24; }

// (public) return value as short (assumes DB>=16)
function bnShortValue() { return (this.t==0)?this.s:(this[0]<<16)>>16; }

// (protected) return x s.t. r^x < DV
function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

// (public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
  if(this.s < 0) return -1;
  else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
  else return 1;
}

// (protected) convert to radix string
function bnpToRadix(b) {
  if(b == null) b = 10;
  if(this.signum() == 0 || b < 2 || b > 36) return "0";
  var cs = this.chunkSize(b);
  var a = Math.pow(b,cs);
  var d = nbv(a), y = nbi(), z = nbi(), r = "";
  this.divRemTo(d,y,z);
  while(y.signum() > 0) {
    r = (a+z.intValue()).toString(b).substr(1) + r;
    y.divRemTo(d,y,z);
  }
  return z.intValue().toString(b) + r;
}

// (protected) convert from radix string
function bnpFromRadix(s,b) {
  this.fromInt(0);
  if(b == null) b = 10;
  var cs = this.chunkSize(b);
  var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
  for(var i = 0; i < s.length; ++i) {
    var x = intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
      continue;
    }
    w = b*w+x;
    if(++j >= cs) {
      this.dMultiply(d);
      this.dAddOffset(w,0);
      j = 0;
      w = 0;
    }
  }
  if(j > 0) {
    this.dMultiply(Math.pow(b,j));
    this.dAddOffset(w,0);
  }
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) alternate constructor
// tutao: on first invocation:
//        a = bitlength (1024)
//        b = number of miller rabin test * 2
//        c = SecureRandom
//       on second invocation:
//        a = bitlength (1024)
//        b = SecureRandom
//        c == undefined
function bnpFromNumber(a,b,c) {
  if("number" == typeof b) {
    // new BigInteger(int,int,RNG)
    if(a < 2) this.fromInt(1);
    else {
      this.fromNumber(a,c);
      if(!this.testBit(a-1))	// force MSB set
        this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
      if(this.isEven()) this.dAddOffset(1,0); // force odd
      while(!this.isProbablePrime(b)) {
        this.dAddOffset(2,0);
        if(this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a-1),this);
      }
    }
  }
  else {
    // new BigInteger(int,RNG)
    var x = new Array(), t = a&7;
    x.length = (a>>3)+1;
    b.nextBytes(x);
    if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
    this.fromString(x,256);
  }
}

// (public) convert to bigendian byte array
function bnToByteArray() {
  var i = this.t, r = new Array();
  r[0] = this.s;
  var p = this.DB-(i*this.DB)%8, d, k = 0;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) != (this.s&this.DM)>>p)
      r[k++] = d|(this.s<<(this.DB-p));
    while(i >= 0) {
      if(p < 8) {
        d = (this[i]&((1<<p)-1))<<(8-p);
        d |= this[--i]>>(p+=this.DB-8);
      }
      else {
        d = (this[i]>>(p-=8))&0xff;
        if(p <= 0) { p += this.DB; --i; }
      }
      if((d&0x80) != 0) d |= -256;
      if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
      if(k > 0 || d != this.s) r[k++] = d;
    }
  }
  return r;
}

function bnEquals(a) { return(this.compareTo(a)==0); }
function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
function bnMax(a) { return(this.compareTo(a)>0)?this:a; }

// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a,op,r) {
  var i, f, m = Math.min(a.t,this.t);
  for(i = 0; i < m; ++i) r[i] = op(this[i],a[i]);
  if(a.t < this.t) {
    f = a.s&this.DM;
    for(i = m; i < this.t; ++i) r[i] = op(this[i],f);
    r.t = this.t;
  }
  else {
    f = this.s&this.DM;
    for(i = m; i < a.t; ++i) r[i] = op(f,a[i]);
    r.t = a.t;
  }
  r.s = op(this.s,a.s);
  r.clamp();
}

// (public) this & a
function op_and(x,y) { return x&y; }
function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

// (public) this | a
function op_or(x,y) { return x|y; }
function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

// (public) this ^ a
function op_xor(x,y) { return x^y; }
function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

// (public) this & ~a
function op_andnot(x,y) { return x&~y; }
function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

// (public) ~this
function bnNot() {
  var r = nbi();
  for(var i = 0; i < this.t; ++i) r[i] = this.DM&~this[i];
  r.t = this.t;
  r.s = ~this.s;
  return r;
}

// (public) this << n
function bnShiftLeft(n) {
  var r = nbi();
  if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
  return r;
}

// (public) this >> n
function bnShiftRight(n) {
  var r = nbi();
  if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
  return r;
}

// return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
  if(x == 0) return -1;
  var r = 0;
  if((x&0xffff) == 0) { x >>= 16; r += 16; }
  if((x&0xff) == 0) { x >>= 8; r += 8; }
  if((x&0xf) == 0) { x >>= 4; r += 4; }
  if((x&3) == 0) { x >>= 2; r += 2; }
  if((x&1) == 0) ++r;
  return r;
}

// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
  for(var i = 0; i < this.t; ++i)
    if(this[i] != 0) return i*this.DB+lbit(this[i]);
  if(this.s < 0) return this.t*this.DB;
  return -1;
}

// return number of 1 bits in x
function cbit(x) {
  var r = 0;
  while(x != 0) { x &= x-1; ++r; }
  return r;
}

// (public) return number of set bits
function bnBitCount() {
  var r = 0, x = this.s&this.DM;
  for(var i = 0; i < this.t; ++i) r += cbit(this[i]^x);
  return r;
}

// (public) true iff nth bit is set
function bnTestBit(n) {
  var j = Math.floor(n/this.DB);
  if(j >= this.t) return(this.s!=0);
  return((this[j]&(1<<(n%this.DB)))!=0);
}

// (protected) this op (1<<n)
function bnpChangeBit(n,op) {
  var r = BigInteger.ONE.shiftLeft(n);
  this.bitwiseTo(r,op,r);
  return r;
}

// (public) this | (1<<n)
function bnSetBit(n) { return this.changeBit(n,op_or); }

// (public) this & ~(1<<n)
function bnClearBit(n) { return this.changeBit(n,op_andnot); }

// (public) this ^ (1<<n)
function bnFlipBit(n) { return this.changeBit(n,op_xor); }

// (protected) r = this + a
function bnpAddTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]+a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c += a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c += a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += a.s;
  }
  r.s = (c<0)?-1:0;
  if(c > 0) r[i++] = c;
  else if(c < -1) r[i++] = this.DV+c;
  r.t = i;
  r.clamp();
}

// (public) this + a
function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

// (public) this - a
function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

// (public) this * a
function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

// (public) this^2
function bnSquare() { var r = nbi(); this.squareTo(r); return r; }

// (public) this / a
function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

// (public) this % a
function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

// (public) [this/a,this%a]
function bnDivideAndRemainder(a) {
  var q = nbi(), r = nbi();
  this.divRemTo(a,q,r);
  return new Array(q,r);
}

// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
  this[this.t] = this.am(0,n-1,this,0,0,this.t);
  ++this.t;
  this.clamp();
}

// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n,w) {
  if(n == 0) return;
  while(this.t <= w) this[this.t++] = 0;
  this[w] += n;
  while(this[w] >= this.DV) {
    this[w] -= this.DV;
    if(++w >= this.t) this[this.t++] = 0;
    ++this[w];
  }
}

// A "null" reducer
function NullExp() {}
function nNop(x) { return x; }
function nMulTo(x,y,r) { x.multiplyTo(y,r); }
function nSqrTo(x,r) { x.squareTo(r); }

NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;

// (public) this^e
function bnPow(e) { return this.exp(e,new NullExp()); }

// (protected) r = lower n words of "this * a", a.t <= n
// "this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a,n,r) {
  var i = Math.min(this.t+a.t,n);
  r.s = 0; // assumes a,this >= 0
  r.t = i;
  while(i > 0) r[--i] = 0;
  var j;
  for(j = r.t-this.t; i < j; ++i) r[i+this.t] = this.am(0,a[i],r,i,0,this.t);
  for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a[i],r,i,0,n-i);
  r.clamp();
}

// (protected) r = "this * a" without lower n words, n > 0
// "this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a,n,r) {
  --n;
  var i = r.t = this.t+a.t-n;
  r.s = 0; // assumes a,this >= 0
  while(--i >= 0) r[i] = 0;
  for(i = Math.max(n-this.t,0); i < a.t; ++i)
    r[this.t+i-n] = this.am(n-i,a[i],r,0,0,this.t+i-n);
  r.clamp();
  r.drShiftTo(1,r);
}

// Barrett modular reduction
function Barrett(m) {
  // setup Barrett
  this.r2 = nbi();
  this.q3 = nbi();
  BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
  this.mu = this.r2.divide(m);
  this.m = m;
}

function barrettConvert(x) {
  if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
  else if(x.compareTo(this.m) < 0) return x;
  else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
}

function barrettRevert(x) { return x; }

// x = x mod m (HAC 14.42)
function barrettReduce(x) {
  x.drShiftTo(this.m.t-1,this.r2);
  if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
  this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
  this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
  while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
  x.subTo(this.r2,x);
  while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = x^2 mod m; x != r
function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = x*y mod m; x,y != r
function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;

// (public) this^e % m (HAC 14.85)
function bnModPow(e,m) {
	// we switched to leemons bigint lib for modpow, as this is faster on safari browsers (reduced the decryption times: 9s -> 3,4s)
	// TODO introduce switch for other browsers, as they are slower (by factor 0.5) because of the conversion overhead
	var xHex = this.toString(16);
	var eHex = e.toString(16);
	var mHex = m.toString(16);
	var result = powMod(str2bigInt(xHex,16),str2bigInt(eHex,16),str2bigInt(mHex,16));
	return new BigInteger(bigInt2str(result,16),16);
//  var i = e.bitLength(), k, r = nbv(1), z;
//  if(i <= 0) return r;
//  else if(i < 18) k = 1;
//  else if(i < 48) k = 3;
//  else if(i < 144) k = 4;
//  else if(i < 768) k = 5;
//  else k = 6;
//  if(i < 8)
//    z = new Classic(m);
//  else if(m.isEven())
//    z = new Barrett(m);
//  else
//    z = new Montgomery(m);
//
//  // precomputation
//  var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
//  g[1] = z.convert(this);
//  if(k > 1) {
//    var g2 = nbi();
//    z.sqrTo(g[1],g2);
//    while(n <= km) {
//      g[n] = nbi();
//      z.mulTo(g2,g[n-2],g[n]);
//      n += 2;
//    }
//  }
//
//  var j = e.t-1, w, is1 = true, r2 = nbi(), t;
//  i = nbits(e[j])-1;
//  while(j >= 0) {
//    if(i >= k1) w = (e[j]>>(i-k1))&km;
//    else {
//      w = (e[j]&((1<<(i+1))-1))<<(k1-i);
//      if(j > 0) w |= e[j-1]>>(this.DB+i-k1);
//    }
//
//    n = k;
//    while((w&1) == 0) { w >>= 1; --n; }
//    if((i -= n) < 0) { i += this.DB; --j; }
//    if(is1) {	// ret == 1, don't bother squaring or multiplying it
//      g[w].copyTo(r);
//      is1 = false;
//    }
//    else {
//      while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
//      if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
//      z.mulTo(r2,g[w],r);
//    }
//
//    while(j >= 0 && (e[j]&(1<<i)) == 0) {
//      z.sqrTo(r,r2); t = r; r = r2; r2 = t;
//      if(--i < 0) { i = this.DB-1; --j; }
//    }
//  }
//  return z.revert(r);
}

// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
  var x = (this.s<0)?this.negate():this.clone();
  var y = (a.s<0)?a.negate():a.clone();
  if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
  var i = x.getLowestSetBit(), g = y.getLowestSetBit();
  if(g < 0) return x;
  if(i < g) g = i;
  if(g > 0) {
    x.rShiftTo(g,x);
    y.rShiftTo(g,y);
  }
  while(x.signum() > 0) {
    if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
    if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
    if(x.compareTo(y) >= 0) {
      x.subTo(y,x);
      x.rShiftTo(1,x);
    }
    else {
      y.subTo(x,y);
      y.rShiftTo(1,y);
    }
  }
  if(g > 0) y.lShiftTo(g,y);
  return y;
}

// (protected) this % n, n < 2^26
function bnpModInt(n) {
  if(n <= 0) return 0;
  var d = this.DV%n, r = (this.s<0)?n-1:0;
  if(this.t > 0)
    if(d == 0) r = this[0]%n;
    else for(var i = this.t-1; i >= 0; --i) r = (d*r+this[i])%n;
  return r;
}

// (public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
  var ac = m.isEven();
  if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
  var u = m.clone(), v = this.clone();
  var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
  while(u.signum() != 0) {
    while(u.isEven()) {
      u.rShiftTo(1,u);
      if(ac) {
        if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
        a.rShiftTo(1,a);
      }
      else if(!b.isEven()) b.subTo(m,b);
      b.rShiftTo(1,b);
    }
    while(v.isEven()) {
      v.rShiftTo(1,v);
      if(ac) {
        if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
        c.rShiftTo(1,c);
      }
      else if(!d.isEven()) d.subTo(m,d);
      d.rShiftTo(1,d);
    }
    if(u.compareTo(v) >= 0) {
      u.subTo(v,u);
      if(ac) a.subTo(c,a);
      b.subTo(d,b);
    }
    else {
      v.subTo(u,v);
      if(ac) c.subTo(a,c);
      d.subTo(b,d);
    }
  }
  if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
  if(d.compareTo(m) >= 0) return d.subtract(m);
  if(d.signum() < 0) d.addTo(m,d); else return d;
  if(d.signum() < 0) return d.add(m); else return d;
}

var lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];
var lplim = (1<<26)/lowprimes[lowprimes.length-1];

// (public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t) {
  var i, x = this.abs();
  if(x.t == 1 && x[0] <= lowprimes[lowprimes.length-1]) {
    for(i = 0; i < lowprimes.length; ++i)
      if(x[0] == lowprimes[i]) return true;
    return false;
  }
  if(x.isEven()) return false;
  i = 1;
  while(i < lowprimes.length) {
    var m = lowprimes[i], j = i+1;
    while(j < lowprimes.length && m < lplim) m *= lowprimes[j++];
    m = x.modInt(m);
    while(i < j) if(m%lowprimes[i++] == 0) return false;
  }
  return x.millerRabin(t);
}

// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t) {
  var n1 = this.subtract(BigInteger.ONE);
  var k = n1.getLowestSetBit();
  if(k <= 0) return false;
  var r = n1.shiftRight(k);
  t = (t+1)>>1;
  if(t > lowprimes.length) t = lowprimes.length;
  var a = nbi();
  for(var i = 0; i < t; ++i) {
    //Pick bases at random, instead of starting at 2
    // TUTAO: It is fine to use Math.random() instead secure random here because it is only used for checking if the number is a prime. The number itself is generated with the secure random number generator.
    a.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);
    var y = a.modPow(r,this);
    if(y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
      var j = 1;
      while(j++ < k && y.compareTo(n1) != 0) {
        y = y.modPowInt(2,this);
        if(y.compareTo(BigInteger.ONE) == 0) return false;
      }
      if(y.compareTo(n1) != 0) return false;
    }
  }
  return true;
}

// protected
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;

// public
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;

// JSBN-specific extension
BigInteger.prototype.square = bnSquare;

// BigInteger interfaces not implemented in jsbn:

// BigInteger(int signum, byte[] magnitude)
// double doubleValue()
// float floatValue()
// int hashCode()
// long longValue()
// static BigInteger valueOf(long val)

// Depends on jsbn.js and rng.js

// Version 1.1: support utf-8 encoding in pkcs1pad2

// convert a (hex) string to a bignum object
function parseBigInt(str,r) {
  return new BigInteger(str,r);
}

function linebrk(s,n) {
  var ret = "";
  var i = 0;
  while(i + n < s.length) {
    ret += s.substring(i,i+n) + "\n";
    i += n;
  }
  return ret + s.substring(i,s.length);
}

function byte2Hex(b) {
  if(b < 0x10)
    return "0" + b.toString(16);
  else
    return b.toString(16);
}

// PKCS#1 (type 2, random) pad input string s to n bytes, and return a bigint
function pkcs1pad2(s,n) {
  if(n < s.length + 11) { // TODO: fix for utf-8
    alert("Message too long for RSA");
    return null;
  }
  var ba = new Array();
  var i = s.length - 1;
  while(i >= 0 && n > 0) {
    var c = s.charCodeAt(i--);
    if(c < 128) { // encode using utf-8
      ba[--n] = c;
    }
    else if((c > 127) && (c < 2048)) {
      ba[--n] = (c & 63) | 128;
      ba[--n] = (c >> 6) | 192;
    }
    else {
      ba[--n] = (c & 63) | 128;
      ba[--n] = ((c >> 6) & 63) | 128;
      ba[--n] = (c >> 12) | 224;
    }
  }
  ba[--n] = 0;
  var rng = new SecureRandom();
  var x = new Array();
  while(n > 2) { // random non-zero pad
    x[0] = 0;
    while(x[0] == 0) rng.nextBytes(x);
    ba[--n] = x[0];
  }
  ba[--n] = 2;
  ba[--n] = 0;
  return new BigInteger(ba);
}

// "empty" RSA key constructor
function RSAKey() {
  this.n = null;
  this.e = 0;
  this.d = null;
  this.p = null;
  this.q = null;
  this.dmp1 = null;
  this.dmq1 = null;
  this.coeff = null;
}

// Set the public key fields N and e from hex strings
function RSASetPublic(N,E) {
  if(N != null && E != null && N.length > 0 && E.length > 0) {
    this.n = parseBigInt(N,16);
    this.e = parseInt(E,16);
  }
  else
    alert("Invalid RSA public key");
}

// Perform raw public operation on "x": return x^e (mod n)
function RSADoPublic(x) {
  return x.modPowInt(this.e, this.n);
}

// Return the PKCS#1 RSA encryption of "text" as an even-length hex string
function RSAEncrypt(text) {
  var m = pkcs1pad2(text,(this.n.bitLength()+7)>>3);
  if(m == null) return null;
  var c = this.doPublic(m);
  if(c == null) return null;
  var h = c.toString(16);
  if((h.length & 1) == 0) return h; else return "0" + h;
}

// Return the PKCS#1 RSA encryption of "text" as a Base64-encoded string
//function RSAEncryptB64(text) {
//  var h = this.encrypt(text);
//  if(h) return hex2b64(h); else return null;
//}

// protected
RSAKey.prototype.doPublic = RSADoPublic;

// public
RSAKey.prototype.setPublic = RSASetPublic;
RSAKey.prototype.encrypt = RSAEncrypt;
//RSAKey.prototype.encrypt_b64 = RSAEncryptB64;

// Depends on rsa.js and jsbn2.js

// Version 1.1: support utf-8 decoding in pkcs1unpad2

// Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
function pkcs1unpad2(d,n) {
  var b = d.toByteArray();
  var i = 0;
  while(i < b.length && b[i] == 0) ++i;
  if(b.length-i != n-1 || b[i] != 2)
    return null;
  ++i;
  while(b[i] != 0)
    if(++i >= b.length) return null;
  var ret = "";
  while(++i < b.length) {
    var c = b[i] & 255;
    if(c < 128) { // utf-8 decode
      ret += String.fromCharCode(c);
    }
    else if((c > 191) && (c < 224)) {
      ret += String.fromCharCode(((c & 31) << 6) | (b[i+1] & 63));
      ++i;
    }
    else {
      ret += String.fromCharCode(((c & 15) << 12) | ((b[i+1] & 63) << 6) | (b[i+2] & 63));
      i += 2;
    }
  }
  return ret;
}

// Set the private key fields N, e, and d from hex strings
function RSASetPrivate(N,E,D) {
  if(N != null && E != null && N.length > 0 && E.length > 0) {
    this.n = parseBigInt(N,16);
    this.e = parseInt(E,16);
    this.d = parseBigInt(D,16);
  }
  else
    alert("Invalid RSA private key");
}

// Set the private key fields N, e, d and CRT params from hex strings
function RSASetPrivateEx(N,E,D,P,Q,DP,DQ,C) {
  if(N != null && E != null && N.length > 0 && E.length > 0) {
    this.n = parseBigInt(N,16);
    this.e = parseInt(E,16);
    this.d = parseBigInt(D,16);
    this.p = parseBigInt(P,16);
    this.q = parseBigInt(Q,16);
    this.dmp1 = parseBigInt(DP,16);
    this.dmq1 = parseBigInt(DQ,16);
    this.coeff = parseBigInt(C,16);
  }
  else
    alert("Invalid RSA private key");
}

// Generate a new random private key B bits long, using public expt E
function RSAGenerate(B,E) {
    var rng = new SecureRandom();
    var qs = B>>1;
    this.e = parseInt(E,16);
    var ee = new BigInteger(E,16);
    for(;;) {
        for(;;) {
            this.p = new BigInteger(B-qs,10,rng); // tutao: changed parameter b from 1 to 10 (=> 5 rounds); according to HAC 4.49, we only need 2 rounds && discussion: https://github.com/digitalbazaar/forge/issues/28
            // tutao: the prime probability is already guaranteed by the BigInteger constructor above; if(this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.p.isProbablePrime(10)) break;
            if(this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0) break;
        }
        for(;;) {
            // tutao: same changes as above
            this.q = new BigInteger(qs,10,rng);
            if(this.q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0) break;
        }
        if(this.p.compareTo(this.q) <= 0) {
            var t = this.p;
            this.p = this.q;
            this.q = t;
        }
        var p1 = this.p.subtract(BigInteger.ONE);
        var q1 = this.q.subtract(BigInteger.ONE);
        var phi = p1.multiply(q1);
        if(phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
            this.n = this.p.multiply(this.q);
            this.d = ee.modInverse(phi);
            this.dmp1 = this.d.mod(p1);
            this.dmq1 = this.d.mod(q1);
            this.coeff = this.q.modInverse(this.p);
            break;
        }
    }
}

// Perform raw private operation on "x": return x^d (mod n)
function RSADoPrivate(x) {
  if(this.p == null || this.q == null)
    return x.modPow(this.d, this.n);

  // TODO: re-calculate any missing CRT params
  var xp = x.mod(this.p).modPow(this.dmp1, this.p);
  var xq = x.mod(this.q).modPow(this.dmq1, this.q);

  while(xp.compareTo(xq) < 0)
    xp = xp.add(this.p);
  return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
}

// Return the PKCS#1 RSA decryption of "ctext".
// "ctext" is an even-length hex string and the output is a plain string.
function RSADecrypt(ctext) {
  var c = parseBigInt(ctext, 16);
  var m = this.doPrivate(c);
  if(m == null) return null;
  return pkcs1unpad2(m, (this.n.bitLength()+7)>>3);
}

// Return the PKCS#1 RSA decryption of "ctext".
// "ctext" is a Base64-encoded string and the output is a plain string.
//function RSAB64Decrypt(ctext) {
//  var h = b64tohex(ctext);
//  if(h) return this.decrypt(h); else return null;
//}

// protected
RSAKey.prototype.doPrivate = RSADoPrivate;

// public
RSAKey.prototype.setPrivate = RSASetPrivate;
RSAKey.prototype.setPrivateEx = RSASetPrivateEx;
RSAKey.prototype.generate = RSAGenerate;
RSAKey.prototype.decrypt = RSADecrypt;
//RSAKey.prototype.b64_decrypt = RSAB64Decrypt;

////////////////////////////////////////////////////////////////////////////////////////
// Big Integer Library v. 5.4
// Created 2000, last modified 2009
// Leemon Baird
// www.leemon.com
//
// Version history:
// v 5.4  3 Oct 2009
//   - added "var i" to greaterShift() so i is not global. (Thanks to PŽter Szab— for finding that bug)
//
// v 5.3  21 Sep 2009
//   - added randProbPrime(k) for probable primes
//   - unrolled loop in mont_ (slightly faster)
//   - millerRabin now takes a bigInt parameter rather than an int
//
// v 5.2  15 Sep 2009
//   - fixed capitalization in call to int2bigInt in randBigInt
//     (thanks to Emili Evripidou, Reinhold Behringer, and Samuel Macaleese for finding that bug)
//
// v 5.1  8 Oct 2007 
//   - renamed inverseModInt_ to inverseModInt since it doesn't change its parameters
//   - added functions GCD and randBigInt, which call GCD_ and randBigInt_
//   - fixed a bug found by Rob Visser (see comment with his name below)
//   - improved comments
//
// This file is public domain.   You can use it for any purpose without restriction.
// I do not guarantee that it is correct, so use it at your own risk.  If you use 
// it for something interesting, I'd appreciate hearing about it.  If you find 
// any bugs or make any improvements, I'd appreciate hearing about those too.
// It would also be nice if my name and URL were left in the comments.  But none 
// of that is required.
//
// This code defines a bigInt library for arbitrary-precision integers.
// A bigInt is an array of integers storing the value in chunks of bpe bits, 
// little endian (buff[0] is the least significant word).
// Negative bigInts are stored two's complement.  Almost all the functions treat
// bigInts as nonnegative.  The few that view them as two's complement say so
// in their comments.  Some functions assume their parameters have at least one 
// leading zero element. Functions with an underscore at the end of the name put
// their answer into one of the arrays passed in, and have unpredictable behavior 
// in case of overflow, so the caller must make sure the arrays are big enough to 
// hold the answer.  But the average user should never have to call any of the 
// underscored functions.  Each important underscored function has a wrapper function 
// of the same name without the underscore that takes care of the details for you.  
// For each underscored function where a parameter is modified, that same variable 
// must not be used as another argument too.  So, you cannot square x by doing 
// multMod_(x,x,n).  You must use squareMod_(x,n) instead, or do y=dup(x); multMod_(x,y,n).
// Or simply use the multMod(x,x,n) function without the underscore, where
// such issues never arise, because non-underscored functions never change
// their parameters; they always allocate new memory for the answer that is returned.
//
// These functions are designed to avoid frequent dynamic memory allocation in the inner loop.
// For most functions, if it needs a BigInt as a local variable it will actually use
// a global, and will only allocate to it only when it's not the right size.  This ensures
// that when a function is called repeatedly with same-sized parameters, it only allocates
// memory on the first call.
//
// Note that for cryptographic purposes, the calls to Math.random() must 
// be replaced with calls to a better pseudorandom number generator.
//
// In the following, "bigInt" means a bigInt with at least one leading zero element,
// and "integer" means a nonnegative integer less than radix.  In some cases, integer 
// can be negative.  Negative bigInts are 2s complement.
// 
// The following functions do not modify their inputs.
// Those returning a bigInt, string, or Array will dynamically allocate memory for that value.
// Those returning a boolean will return the integer 0 (false) or 1 (true).
// Those returning boolean or int will not allocate memory except possibly on the first 
// time they're called with a given parameter size.
// 
// bigInt  add(x,y)               //return (x+y) for bigInts x and y.  
// bigInt  addInt(x,n)            //return (x+n) where x is a bigInt and n is an integer.
// string  bigInt2str(x,base)     //return a string form of bigInt x in a given base, with 2 <= base <= 95
// int     bitSize(x)             //return how many bits long the bigInt x is, not counting leading zeros
// bigInt  dup(x)                 //return a copy of bigInt x
// boolean equals(x,y)            //is the bigInt x equal to the bigint y?
// boolean equalsInt(x,y)         //is bigint x equal to integer y?
// bigInt  expand(x,n)            //return a copy of x with at least n elements, adding leading zeros if needed
// Array   findPrimes(n)          //return array of all primes less than integer n
// bigInt  GCD(x,y)               //return greatest common divisor of bigInts x and y (each with same number of elements).
// boolean greater(x,y)           //is x>y?  (x and y are nonnegative bigInts)
// boolean greaterShift(x,y,shift)//is (x <<(shift*bpe)) > y?
// bigInt  int2bigInt(t,n,m)      //return a bigInt equal to integer t, with at least n bits and m array elements
// bigInt  inverseMod(x,n)        //return (x**(-1) mod n) for bigInts x and n.  If no inverse exists, it returns null
// int     inverseModInt(x,n)     //return x**(-1) mod n, for integers x and n.  Return 0 if there is no inverse
// boolean isZero(x)              //is the bigInt x equal to zero?
// boolean millerRabin(x,b)       //does one round of Miller-Rabin base integer b say that bigInt x is possibly prime? (b is bigInt, 1<b<x)
// boolean millerRabinInt(x,b)    //does one round of Miller-Rabin base integer b say that bigInt x is possibly prime? (b is int,    1<b<x)
// bigInt  mod(x,n)               //return a new bigInt equal to (x mod n) for bigInts x and n.
// int     modInt(x,n)            //return x mod n for bigInt x and integer n.
// bigInt  mult(x,y)              //return x*y for bigInts x and y. This is faster when y<x.
// bigInt  multMod(x,y,n)         //return (x*y mod n) for bigInts x,y,n.  For greater speed, let y<x.
// boolean negative(x)            //is bigInt x negative?
// bigInt  powMod(x,y,n)          //return (x**y mod n) where x,y,n are bigInts and ** is exponentiation.  0**0=1. Faster for odd n.
// bigInt  randBigInt(n,s)        //return an n-bit random BigInt (n>=1).  If s=1, then the most significant of those n bits is set to 1.
// bigInt  randTruePrime(k)       //return a new, random, k-bit, true prime bigInt using Maurer's algorithm.
// bigInt  randProbPrime(k)       //return a new, random, k-bit, probable prime bigInt (probability it's composite less than 2^-80).
// bigInt  str2bigInt(s,b,n,m)    //return a bigInt for number represented in string s in base b with at least n bits and m array elements
// bigInt  sub(x,y)               //return (x-y) for bigInts x and y.  Negative answers will be 2s complement
// bigInt  trim(x,k)              //return a copy of x with exactly k leading zero elements
//
//
// The following functions each have a non-underscored version, which most users should call instead.
// These functions each write to a single parameter, and the caller is responsible for ensuring the array 
// passed in is large enough to hold the result. 
//
// void    addInt_(x,n)          //do x=x+n where x is a bigInt and n is an integer
// void    add_(x,y)             //do x=x+y for bigInts x and y
// void    copy_(x,y)            //do x=y on bigInts x and y
// void    copyInt_(x,n)         //do x=n on bigInt x and integer n
// void    GCD_(x,y)             //set x to the greatest common divisor of bigInts x and y, (y is destroyed).  (This never overflows its array).
// boolean inverseMod_(x,n)      //do x=x**(-1) mod n, for bigInts x and n. Returns 1 (0) if inverse does (doesn't) exist
// void    mod_(x,n)             //do x=x mod n for bigInts x and n. (This never overflows its array).
// void    mult_(x,y)            //do x=x*y for bigInts x and y.
// void    multMod_(x,y,n)       //do x=x*y  mod n for bigInts x,y,n.
// void    powMod_(x,y,n)        //do x=x**y mod n, where x,y,n are bigInts (n is odd) and ** is exponentiation.  0**0=1.
// void    randBigInt_(b,n,s)    //do b = an n-bit random BigInt. if s=1, then nth bit (most significant bit) is set to 1. n>=1.
// void    randTruePrime_(ans,k) //do ans = a random k-bit true random prime (not just probable prime) with 1 in the msb.
// void    sub_(x,y)             //do x=x-y for bigInts x and y. Negative answers will be 2s complement.
//
// The following functions do NOT have a non-underscored version. 
// They each write a bigInt result to one or more parameters.  The caller is responsible for
// ensuring the arrays passed in are large enough to hold the results. 
//
// void addShift_(x,y,ys)       //do x=x+(y<<(ys*bpe))
// void carry_(x)               //do carries and borrows so each element of the bigInt x fits in bpe bits.
// void divide_(x,y,q,r)        //divide x by y giving quotient q and remainder r
// int  divInt_(x,n)            //do x=floor(x/n) for bigInt x and integer n, and return the remainder. (This never overflows its array).
// int  eGCD_(x,y,d,a,b)        //sets a,b,d to positive bigInts such that d = GCD_(x,y) = a*x-b*y
// void halve_(x)               //do x=floor(|x|/2)*sgn(x) for bigInt x in 2's complement.  (This never overflows its array).
// void leftShift_(x,n)         //left shift bigInt x by n bits.  n<bpe.
// void linComb_(x,y,a,b)       //do x=a*x+b*y for bigInts x and y and integers a and b
// void linCombShift_(x,y,b,ys) //do x=x+b*(y<<(ys*bpe)) for bigInts x and y, and integers b and ys
// void mont_(x,y,n,np)         //Montgomery multiplication (see comments where the function is defined)
// void multInt_(x,n)           //do x=x*n where x is a bigInt and n is an integer.
// void rightShift_(x,n)        //right shift bigInt x by n bits.  0 <= n < bpe. (This never overflows its array).
// void squareMod_(x,n)         //do x=x*x  mod n for bigInts x,n
// void subShift_(x,y,ys)       //do x=x-(y<<(ys*bpe)). Negative answers will be 2s complement.
//
// The following functions are based on algorithms from the _Handbook of Applied Cryptography_
//    powMod_()           = algorithm 14.94, Montgomery exponentiation
//    eGCD_,inverseMod_() = algorithm 14.61, Binary extended GCD_
//    GCD_()              = algorothm 14.57, Lehmer's algorithm
//    mont_()             = algorithm 14.36, Montgomery multiplication
//    divide_()           = algorithm 14.20  Multiple-precision division
//    squareMod_()        = algorithm 14.16  Multiple-precision squaring
//    randTruePrime_()    = algorithm  4.62, Maurer's algorithm
//    millerRabin()       = algorithm  4.24, Miller-Rabin algorithm
//
// Profiling shows:
//     randTruePrime_() spends:
//         10% of its time in calls to powMod_()
//         85% of its time in calls to millerRabin()
//     millerRabin() spends:
//         99% of its time in calls to powMod_()   (always with a base of 2)
//     powMod_() spends:
//         94% of its time in calls to mont_()  (almost always with x==y)
//
// This suggests there are several ways to speed up this library slightly:
//     - convert powMod_ to use a Montgomery form of k-ary window (or maybe a Montgomery form of sliding window)
//         -- this should especially focus on being fast when raising 2 to a power mod n
//     - convert randTruePrime_() to use a minimum r of 1/3 instead of 1/2 with the appropriate change to the test
//     - tune the parameters in randTruePrime_(), including c, m, and recLimit
//     - speed up the single loop in mont_() that takes 95% of the runtime, perhaps by reducing checking
//       within the loop when all the parameters are the same length.
//
// There are several ideas that look like they wouldn't help much at all:
//     - replacing trial division in randTruePrime_() with a sieve (that speeds up something taking almost no time anyway)
//     - increase bpe from 15 to 30 (that would help if we had a 32*32->64 multiplier, but not with JavaScript's 32*32->32)
//     - speeding up mont_(x,y,n,np) when x==y by doing a non-modular, non-Montgomery square
//       followed by a Montgomery reduction.  The intermediate answer will be twice as long as x, so that
//       method would be slower.  This is unfortunate because the code currently spends almost all of its time
//       doing mont_(x,x,...), both for randTruePrime_() and powMod_().  A faster method for Montgomery squaring
//       would have a large impact on the speed of randTruePrime_() and powMod_().  HAC has a couple of poorly-worded
//       sentences that seem to imply it's faster to do a non-modular square followed by a single
//       Montgomery reduction, but that's obviously wrong.
////////////////////////////////////////////////////////////////////////////////////////

//globals
bpe=0;         //bits stored per array element
mask=0;        //AND this with an array element to chop it down to bpe bits
radix=mask+1;  //equals 2^bpe.  A single 1 bit to the left of the last bit of mask.

//the digits for converting to different bases
digitsStr='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_=!@#$%^&*()[]{}|;:,.<>/?`~ \\\'\"+-';

//initialize the global variables
for (bpe=0; (1<<(bpe+1)) > (1<<bpe); bpe++);  //bpe=number of bits in the mantissa on this platform
bpe>>=1;                   //bpe=number of bits in one element of the array representing the bigInt
mask=(1<<bpe)-1;           //AND the mask with an integer to get its bpe least significant bits
radix=mask+1;              //2^bpe.  a single 1 bit to the left of the first bit of mask
one=int2bigInt(1,1,1);     //constant used in powMod_()

//the following global variables are scratchpad memory to 
//reduce dynamic memory allocation in the inner loop
t=new Array(0);
ss=t;       //used in mult_()
s0=t;       //used in multMod_(), squareMod_() 
s1=t;       //used in powMod_(), multMod_(), squareMod_() 
s2=t;       //used in powMod_(), multMod_()
s3=t;       //used in powMod_()
s4=t; s5=t; //used in mod_()
s6=t;       //used in bigInt2str()
s7=t;       //used in powMod_()
T=t;        //used in GCD_()
sa=t;       //used in mont_()
mr_x1=t; mr_r=t; mr_a=t;                                      //used in millerRabin()
eg_v=t; eg_u=t; eg_A=t; eg_B=t; eg_C=t; eg_D=t;               //used in eGCD_(), inverseMod_()
md_q1=t; md_q2=t; md_q3=t; md_r=t; md_r1=t; md_r2=t; md_tt=t; //used in mod_()

primes=t; pows=t; s_i=t; s_i2=t; s_R=t; s_rm=t; s_q=t; s_n1=t; 
  s_a=t; s_r2=t; s_n=t; s_b=t; s_d=t; s_x1=t; s_x2=t, s_aa=t; //used in randTruePrime_()
  
rpprb=t; //used in randProbPrimeRounds() (which also uses "primes")

////////////////////////////////////////////////////////////////////////////////////////


//return array of all primes less than integer n
function findPrimes(n) {
  var i,s,p,ans;
  s=new Array(n);
  for (i=0;i<n;i++)
    s[i]=0;
  s[0]=2;
  p=0;    //first p elements of s are primes, the rest are a sieve
  for(;s[p]<n;) {                  //s[p] is the pth prime
    for(i=s[p]*s[p]; i<n; i+=s[p]) //mark multiples of s[p]
      s[i]=1;
    p++;
    s[p]=s[p-1]+1;
    for(; s[p]<n && s[s[p]]; s[p]++); //find next prime (where s[p]==0)
  }
  ans=new Array(p);
  for(i=0;i<p;i++)
    ans[i]=s[i];
  return ans;
}


//does a single round of Miller-Rabin base b consider x to be a possible prime?
//x is a bigInt, and b is an integer, with b<x
function millerRabinInt(x,b) {
  if (mr_x1.length!=x.length) {
    mr_x1=dup(x);
    mr_r=dup(x);
    mr_a=dup(x);
  }

  copyInt_(mr_a,b);
  return millerRabin(x,mr_a);
}

//does a single round of Miller-Rabin base b consider x to be a possible prime?
//x and b are bigInts with b<x
function millerRabin(x,b) {
  var i,j,k,s;

  if (mr_x1.length!=x.length) {
    mr_x1=dup(x);
    mr_r=dup(x);
    mr_a=dup(x);
  }

  copy_(mr_a,b);
  copy_(mr_r,x);
  copy_(mr_x1,x);

  addInt_(mr_r,-1);
  addInt_(mr_x1,-1);

  //s=the highest power of two that divides mr_r
  k=0;
  for (i=0;i<mr_r.length;i++)
    for (j=1;j<mask;j<<=1)
      if (x[i] & j) {
        s=(k<mr_r.length+bpe ? k : 0); 
         i=mr_r.length;
         j=mask;
      } else
        k++;

  if (s)                
    rightShift_(mr_r,s);

  powMod_(mr_a,mr_r,x);

  if (!equalsInt(mr_a,1) && !equals(mr_a,mr_x1)) {
    j=1;
    while (j<=s-1 && !equals(mr_a,mr_x1)) {
      squareMod_(mr_a,x);
      if (equalsInt(mr_a,1)) {
        return 0;
      }
      j++;
    }
    if (!equals(mr_a,mr_x1)) {
      return 0;
    }
  }
  return 1;  
}

//returns how many bits long the bigInt is, not counting leading zeros.
function bitSize(x) {
  var j,z,w;
  for (j=x.length-1; (x[j]==0) && (j>0); j--);
  for (z=0,w=x[j]; w; (w>>=1),z++);
  z+=bpe*j;
  return z;
}

//return a copy of x with at least n elements, adding leading zeros if needed
function expand(x,n) {
  var ans=int2bigInt(0,(x.length>n ? x.length : n)*bpe,0);
  copy_(ans,x);
  return ans;
}

//return a k-bit true random prime using Maurer's algorithm.
function randTruePrime(k) {
  var ans=int2bigInt(0,k,0);
  randTruePrime_(ans,k);
  return trim(ans,1);
}

//return a k-bit random probable prime with probability of error < 2^-80
function randProbPrime(k) {
  if (k>=600) return randProbPrimeRounds(k,2); //numbers from HAC table 4.3
  if (k>=550) return randProbPrimeRounds(k,4);
  if (k>=500) return randProbPrimeRounds(k,5);
  if (k>=400) return randProbPrimeRounds(k,6);
  if (k>=350) return randProbPrimeRounds(k,7);
  if (k>=300) return randProbPrimeRounds(k,9);
  if (k>=250) return randProbPrimeRounds(k,12); //numbers from HAC table 4.4
  if (k>=200) return randProbPrimeRounds(k,15);
  if (k>=150) return randProbPrimeRounds(k,18);
  if (k>=100) return randProbPrimeRounds(k,27);
              return randProbPrimeRounds(k,40); //number from HAC remark 4.26 (only an estimate)
}

//return a k-bit probable random prime using n rounds of Miller Rabin (after trial division with small primes)	
function randProbPrimeRounds(k,n) {
  var ans, i, divisible, B; 
  B=30000;  //B is largest prime to use in trial division
  ans=int2bigInt(0,k,0);
  
  //optimization: try larger and smaller B to find the best limit.
  
  if (primes.length==0)
    primes=findPrimes(30000);  //check for divisibility by primes <=30000

  if (rpprb.length!=ans.length)
    rpprb=dup(ans);

  for (;;) { //keep trying random values for ans until one appears to be prime
    //optimization: pick a random number times L=2*3*5*...*p, plus a 
    //   random element of the list of all numbers in [0,L) not divisible by any prime up to p.
    //   This can reduce the amount of random number generation.
    
    randBigInt_(ans,k,0); //ans = a random odd number to check
    ans[0] |= 1; 
    divisible=0;
  
    //check ans for divisibility by small primes up to B
    for (i=0; (i<primes.length) && (primes[i]<=B); i++)
      if (modInt(ans,primes[i])==0 && !equalsInt(ans,primes[i])) {
        divisible=1;
        break;
      }      
    
    //optimization: change millerRabin so the base can be bigger than the number being checked, then eliminate the while here.
    
    //do n rounds of Miller Rabin, with random bases less than ans
    for (i=0; i<n && !divisible; i++) {
      randBigInt_(rpprb,k,0);
      while(!greater(ans,rpprb)) //pick a random rpprb that's < ans
        randBigInt_(rpprb,k,0);
      if (!millerRabin(ans,rpprb))
        divisible=1;
    }
    
    if(!divisible)
      return ans;
  }  
}

//return a new bigInt equal to (x mod n) for bigInts x and n.
function mod(x,n) {
  var ans=dup(x);
  mod_(ans,n);
  return trim(ans,1);
}

//return (x+n) where x is a bigInt and n is an integer.
function addInt(x,n) {
  var ans=expand(x,x.length+1);
  addInt_(ans,n);
  return trim(ans,1);
}

//return x*y for bigInts x and y. This is faster when y<x.
function mult(x,y) {
  var ans=expand(x,x.length+y.length);
  mult_(ans,y);
  return trim(ans,1);
}

//return (x**y mod n) where x,y,n are bigInts and ** is exponentiation.  0**0=1. Faster for odd n.
function powMod(x,y,n) {
  var ans=expand(x,n.length);  
  powMod_(ans,trim(y,2),trim(n,2),0);  //this should work without the trim, but doesn't
  return trim(ans,1);
}

//return (x-y) for bigInts x and y.  Negative answers will be 2s complement
function sub(x,y) {
  var ans=expand(x,(x.length>y.length ? x.length+1 : y.length+1)); 
  sub_(ans,y);
  return trim(ans,1);
}

//return (x+y) for bigInts x and y.  
function add(x,y) {
  var ans=expand(x,(x.length>y.length ? x.length+1 : y.length+1)); 
  add_(ans,y);
  return trim(ans,1);
}

//return (x**(-1) mod n) for bigInts x and n.  If no inverse exists, it returns null
function inverseMod(x,n) {
  var ans=expand(x,n.length); 
  var s;
  s=inverseMod_(ans,n);
  return s ? trim(ans,1) : null;
}

//return (x*y mod n) for bigInts x,y,n.  For greater speed, let y<x.
function multMod(x,y,n) {
  var ans=expand(x,n.length);
  multMod_(ans,y,n);
  return trim(ans,1);
}

/* TUTAO: not used
//generate a k-bit true random prime using Maurer's algorithm,
//and put it into ans.  The bigInt ans must be large enough to hold it.
function randTruePrime_(ans,k) {
  var c,m,pm,dd,j,r,B,divisible,z,zz,recSize;

  if (primes.length==0)
    primes=findPrimes(30000);  //check for divisibility by primes <=30000

  if (pows.length==0) {
    pows=new Array(512);
    for (j=0;j<512;j++) {
      pows[j]=Math.pow(2,j/511.-1.);
    }
  }

  //c and m should be tuned for a particular machine and value of k, to maximize speed
  c=0.1;  //c=0.1 in HAC
  m=20;   //generate this k-bit number by first recursively generating a number that has between k/2 and k-m bits
  recLimit=20; //stop recursion when k <=recLimit.  Must have recLimit >= 2

  if (s_i2.length!=ans.length) {
    s_i2=dup(ans);
    s_R =dup(ans);
    s_n1=dup(ans);
    s_r2=dup(ans);
    s_d =dup(ans);
    s_x1=dup(ans);
    s_x2=dup(ans);
    s_b =dup(ans);
    s_n =dup(ans);
    s_i =dup(ans);
    s_rm=dup(ans);
    s_q =dup(ans);
    s_a =dup(ans);
    s_aa=dup(ans);
  }

  if (k <= recLimit) {  //generate small random primes by trial division up to its square root
    pm=(1<<((k+2)>>1))-1; //pm is binary number with all ones, just over sqrt(2^k)
    copyInt_(ans,0);
    for (dd=1;dd;) {
      dd=0;
      ans[0]= 1 | (1<<(k-1)) | Math.floor(Math.random()*(1<<k));  //random, k-bit, odd integer, with msb 1
      for (j=1;(j<primes.length) && ((primes[j]&pm)==primes[j]);j++) { //trial division by all primes 3...sqrt(2^k)
        if (0==(ans[0]%primes[j])) {
          dd=1;
          break;
        }
      }
    }
    carry_(ans);
    return;
  }

  B=c*k*k;    //try small primes up to B (or all the primes[] array if the largest is less than B).
  if (k>2*m)  //generate this k-bit number by first recursively generating a number that has between k/2 and k-m bits
    for (r=1; k-k*r<=m; )
      r=pows[Math.floor(Math.random()*512)];   //r=Math.pow(2,Math.random()-1);
  else
    r=.5;

  //simulation suggests the more complex algorithm using r=.333 is only slightly faster.

  recSize=Math.floor(r*k)+1;

  randTruePrime_(s_q,recSize);
  copyInt_(s_i2,0);
  s_i2[Math.floor((k-2)/bpe)] |= (1<<((k-2)%bpe));   //s_i2=2^(k-2)
  divide_(s_i2,s_q,s_i,s_rm);                        //s_i=floor((2^(k-1))/(2q))

  z=bitSize(s_i);

  for (;;) {
    for (;;) {  //generate z-bit numbers until one falls in the range [0,s_i-1]
      randBigInt_(s_R,z,0);
      if (greater(s_i,s_R))
        break;
    }                //now s_R is in the range [0,s_i-1]
    addInt_(s_R,1);  //now s_R is in the range [1,s_i]
    add_(s_R,s_i);   //now s_R is in the range [s_i+1,2*s_i]

    copy_(s_n,s_q);
    mult_(s_n,s_R); 
    multInt_(s_n,2);
    addInt_(s_n,1);    //s_n=2*s_R*s_q+1
    
    copy_(s_r2,s_R);
    multInt_(s_r2,2);  //s_r2=2*s_R

    //check s_n for divisibility by small primes up to B
    for (divisible=0,j=0; (j<primes.length) && (primes[j]<B); j++)
      if (modInt(s_n,primes[j])==0 && !equalsInt(s_n,primes[j])) {
        divisible=1;
        break;
      }      

    if (!divisible)    //if it passes small primes check, then try a single Miller-Rabin base 2
      if (!millerRabinInt(s_n,2)) //this line represents 75% of the total runtime for randTruePrime_ 
        divisible=1;

    if (!divisible) {  //if it passes that test, continue checking s_n
      addInt_(s_n,-3);
      for (j=s_n.length-1;(s_n[j]==0) && (j>0); j--);  //strip leading zeros
      for (zz=0,w=s_n[j]; w; (w>>=1),zz++);
      zz+=bpe*j;                             //zz=number of bits in s_n, ignoring leading zeros
      for (;;) {  //generate z-bit numbers until one falls in the range [0,s_n-1]
        randBigInt_(s_a,zz,0);
        if (greater(s_n,s_a))
          break;
      }                //now s_a is in the range [0,s_n-1]
      addInt_(s_n,3);  //now s_a is in the range [0,s_n-4]
      addInt_(s_a,2);  //now s_a is in the range [2,s_n-2]
      copy_(s_b,s_a);
      copy_(s_n1,s_n);
      addInt_(s_n1,-1);
      powMod_(s_b,s_n1,s_n);   //s_b=s_a^(s_n-1) modulo s_n
      addInt_(s_b,-1);
      if (isZero(s_b)) {
        copy_(s_b,s_a);
        powMod_(s_b,s_r2,s_n);
        addInt_(s_b,-1);
        copy_(s_aa,s_n);
        copy_(s_d,s_b);
        GCD_(s_d,s_n);  //if s_b and s_n are relatively prime, then s_n is a prime
        if (equalsInt(s_d,1)) {
          copy_(ans,s_aa);
          return;     //if we've made it this far, then s_n is absolutely guaranteed to be prime
        }
      }
    }
  }
}
*/

//Return an n-bit random BigInt (n>=1).  If s=1, then the most significant of those n bits is set to 1.
function randBigInt(n,s) {
  var a,b;
  a=Math.floor((n-1)/bpe)+2; //# array elements to hold the BigInt with a leading 0 element
  b=int2bigInt(0,0,a);
  randBigInt_(b,n,s);
  return b;
}

/* TUTAO: not used
//Set b to an n-bit random BigInt.  If s=1, then the most significant of those n bits is set to 1.
//Array b must be big enough to hold the result. Must have n>=1
function randBigInt_(b,n,s) {
  var i,a;
  for (i=0;i<b.length;i++)
    b[i]=0;
  a=Math.floor((n-1)/bpe)+1; //# array elements to hold the BigInt
  for (i=0;i<a;i++) {
    b[i]=Math.floor(Math.random()*(1<<(bpe-1)));
  }
  b[a-1] &= (2<<((n-1)%bpe))-1;
  if (s==1)
    b[a-1] |= (1<<((n-1)%bpe));
}
*/

//Return the greatest common divisor of bigInts x and y (each with same number of elements).
function GCD(x,y) {
  var xc,yc;
  xc=dup(x);
  yc=dup(y);
  GCD_(xc,yc);
  return xc;
}

//set x to the greatest common divisor of bigInts x and y (each with same number of elements).
//y is destroyed.
function GCD_(x,y) {
  var i,xp,yp,A,B,C,D,q,sing;
  if (T.length!=x.length)
    T=dup(x);

  sing=1;
  while (sing) { //while y has nonzero elements other than y[0]
    sing=0;
    for (i=1;i<y.length;i++) //check if y has nonzero elements other than 0
      if (y[i]) {
        sing=1;
        break;
      }
    if (!sing) break; //quit when y all zero elements except possibly y[0]

    for (i=x.length;!x[i] && i>=0;i--);  //find most significant element of x
    xp=x[i];
    yp=y[i];
    A=1; B=0; C=0; D=1;
    while ((yp+C) && (yp+D)) {
      q =Math.floor((xp+A)/(yp+C));
      qp=Math.floor((xp+B)/(yp+D));
      if (q!=qp)
        break;
      t= A-q*C;   A=C;   C=t;    //  do (A,B,xp, C,D,yp) = (C,D,yp, A,B,xp) - q*(0,0,0, C,D,yp)      
      t= B-q*D;   B=D;   D=t;
      t=xp-q*yp; xp=yp; yp=t;
    }
    if (B) {
      copy_(T,x);
      linComb_(x,y,A,B); //x=A*x+B*y
      linComb_(y,T,D,C); //y=D*y+C*T
    } else {
      mod_(x,y);
      copy_(T,x);
      copy_(x,y);
      copy_(y,T);
    } 
  }
  if (y[0]==0)
    return;
  t=modInt(x,y[0]);
  copyInt_(x,y[0]);
  y[0]=t;
  while (y[0]) {
    x[0]%=y[0];
    t=x[0]; x[0]=y[0]; y[0]=t;
  }
}

//do x=x**(-1) mod n, for bigInts x and n.
//If no inverse exists, it sets x to zero and returns 0, else it returns 1.
//The x array must be at least as large as the n array.
function inverseMod_(x,n) {
  var k=1+2*Math.max(x.length,n.length);

  if(!(x[0]&1)  && !(n[0]&1)) {  //if both inputs are even, then inverse doesn't exist
    copyInt_(x,0);
    return 0;
  }

  if (eg_u.length!=k) {
    eg_u=new Array(k);
    eg_v=new Array(k);
    eg_A=new Array(k);
    eg_B=new Array(k);
    eg_C=new Array(k);
    eg_D=new Array(k);
  }

  copy_(eg_u,x);
  copy_(eg_v,n);
  copyInt_(eg_A,1);
  copyInt_(eg_B,0);
  copyInt_(eg_C,0);
  copyInt_(eg_D,1);
  for (;;) {
    while(!(eg_u[0]&1)) {  //while eg_u is even
      halve_(eg_u);
      if (!(eg_A[0]&1) && !(eg_B[0]&1)) { //if eg_A==eg_B==0 mod 2
        halve_(eg_A);
        halve_(eg_B);      
      } else {
        add_(eg_A,n);  halve_(eg_A);
        sub_(eg_B,x);  halve_(eg_B);
      }
    }

    while (!(eg_v[0]&1)) {  //while eg_v is even
      halve_(eg_v);
      if (!(eg_C[0]&1) && !(eg_D[0]&1)) { //if eg_C==eg_D==0 mod 2
        halve_(eg_C);
        halve_(eg_D);      
      } else {
        add_(eg_C,n);  halve_(eg_C);
        sub_(eg_D,x);  halve_(eg_D);
      }
    }

    if (!greater(eg_v,eg_u)) { //eg_v <= eg_u
      sub_(eg_u,eg_v);
      sub_(eg_A,eg_C);
      sub_(eg_B,eg_D);
    } else {                   //eg_v > eg_u
      sub_(eg_v,eg_u);
      sub_(eg_C,eg_A);
      sub_(eg_D,eg_B);
    }
  
    if (equalsInt(eg_u,0)) {
      if (negative(eg_C)) //make sure answer is nonnegative
        add_(eg_C,n);
      copy_(x,eg_C);

      if (!equalsInt(eg_v,1)) { //if GCD_(x,n)!=1, then there is no inverse
        copyInt_(x,0);
        return 0;
      }
      return 1;
    }
  }
}

//return x**(-1) mod n, for integers x and n.  Return 0 if there is no inverse
function inverseModInt(x,n) {
  var a=1,b=0,t;
  for (;;) {
    if (x==1) return a;
    if (x==0) return 0;
    b-=a*Math.floor(n/x);
    n%=x;

    if (n==1) return b; //to avoid negatives, change this b to n-b, and each -= to +=
    if (n==0) return 0;
    a-=b*Math.floor(x/n);
    x%=n;
  }
}

//this deprecated function is for backward compatibility only. 
function inverseModInt_(x,n) {
   return inverseModInt(x,n);
}


//Given positive bigInts x and y, change the bigints v, a, and b to positive bigInts such that:
//     v = GCD_(x,y) = a*x-b*y
//The bigInts v, a, b, must have exactly as many elements as the larger of x and y.
function eGCD_(x,y,v,a,b) {
  var g=0;
  var k=Math.max(x.length,y.length);
  if (eg_u.length!=k) {
    eg_u=new Array(k);
    eg_A=new Array(k);
    eg_B=new Array(k);
    eg_C=new Array(k);
    eg_D=new Array(k);
  }
  while(!(x[0]&1)  && !(y[0]&1)) {  //while x and y both even
    halve_(x);
    halve_(y);
    g++;
  }
  copy_(eg_u,x);
  copy_(v,y);
  copyInt_(eg_A,1);
  copyInt_(eg_B,0);
  copyInt_(eg_C,0);
  copyInt_(eg_D,1);
  for (;;) {
    while(!(eg_u[0]&1)) {  //while u is even
      halve_(eg_u);
      if (!(eg_A[0]&1) && !(eg_B[0]&1)) { //if A==B==0 mod 2
        halve_(eg_A);
        halve_(eg_B);      
      } else {
        add_(eg_A,y);  halve_(eg_A);
        sub_(eg_B,x);  halve_(eg_B);
      }
    }

    while (!(v[0]&1)) {  //while v is even
      halve_(v);
      if (!(eg_C[0]&1) && !(eg_D[0]&1)) { //if C==D==0 mod 2
        halve_(eg_C);
        halve_(eg_D);      
      } else {
        add_(eg_C,y);  halve_(eg_C);
        sub_(eg_D,x);  halve_(eg_D);
      }
    }

    if (!greater(v,eg_u)) { //v<=u
      sub_(eg_u,v);
      sub_(eg_A,eg_C);
      sub_(eg_B,eg_D);
    } else {                //v>u
      sub_(v,eg_u);
      sub_(eg_C,eg_A);
      sub_(eg_D,eg_B);
    }
    if (equalsInt(eg_u,0)) {
      if (negative(eg_C)) {   //make sure a (C)is nonnegative
        add_(eg_C,y);
        sub_(eg_D,x);
      }
      multInt_(eg_D,-1);  ///make sure b (D) is nonnegative
      copy_(a,eg_C);
      copy_(b,eg_D);
      leftShift_(v,g);
      return;
    }
  }
}


//is bigInt x negative?
function negative(x) {
  return ((x[x.length-1]>>(bpe-1))&1);
}


//is (x << (shift*bpe)) > y?
//x and y are nonnegative bigInts
//shift is a nonnegative integer
function greaterShift(x,y,shift) {
  var i, kx=x.length, ky=y.length;
  k=((kx+shift)<ky) ? (kx+shift) : ky;
  for (i=ky-1-shift; i<kx && i>=0; i++) 
    if (x[i]>0)
      return 1; //if there are nonzeros in x to the left of the first column of y, then x is bigger
  for (i=kx-1+shift; i<ky; i++)
    if (y[i]>0)
      return 0; //if there are nonzeros in y to the left of the first column of x, then x is not bigger
  for (i=k-1; i>=shift; i--)
    if      (x[i-shift]>y[i]) return 1;
    else if (x[i-shift]<y[i]) return 0;
  return 0;
}

//is x > y? (x and y both nonnegative)
function greater(x,y) {
  var i;
  var k=(x.length<y.length) ? x.length : y.length;

  for (i=x.length;i<y.length;i++)
    if (y[i])
      return 0;  //y has more digits

  for (i=y.length;i<x.length;i++)
    if (x[i])
      return 1;  //x has more digits

  for (i=k-1;i>=0;i--)
    if (x[i]>y[i])
      return 1;
    else if (x[i]<y[i])
      return 0;
  return 0;
}

//divide x by y giving quotient q and remainder r.  (q=floor(x/y),  r=x mod y).  All 4 are bigints.
//x must have at least one leading zero element.
//y must be nonzero.
//q and r must be arrays that are exactly the same length as x. (Or q can have more).
//Must have x.length >= y.length >= 2.
function divide_(x,y,q,r) {
  var kx, ky;
  var i,j,y1,y2,c,a,b;
  copy_(r,x);
  for (ky=y.length;y[ky-1]==0;ky--); //ky is number of elements in y, not including leading zeros

  //normalize: ensure the most significant element of y has its highest bit set  
  b=y[ky-1];
  for (a=0; b; a++)
    b>>=1;  
  a=bpe-a;  //a is how many bits to shift so that the high order bit of y is leftmost in its array element
  leftShift_(y,a);  //multiply both by 1<<a now, then divide both by that at the end
  leftShift_(r,a);

  //Rob Visser discovered a bug: the following line was originally just before the normalization.
  for (kx=r.length;r[kx-1]==0 && kx>ky;kx--); //kx is number of elements in normalized x, not including leading zeros

  copyInt_(q,0);                      // q=0
  while (!greaterShift(y,r,kx-ky)) {  // while (leftShift_(y,kx-ky) <= r) {
    subShift_(r,y,kx-ky);             //   r=r-leftShift_(y,kx-ky)
    q[kx-ky]++;                       //   q[kx-ky]++;
  }                                   // }

  for (i=kx-1; i>=ky; i--) {
    if (r[i]==y[ky-1])
      q[i-ky]=mask;
    else
      q[i-ky]=Math.floor((r[i]*radix+r[i-1])/y[ky-1]);	

    //The following for(;;) loop is equivalent to the commented while loop, 
    //except that the uncommented version avoids overflow.
    //The commented loop comes from HAC, which assumes r[-1]==y[-1]==0
    //  while (q[i-ky]*(y[ky-1]*radix+y[ky-2]) > r[i]*radix*radix+r[i-1]*radix+r[i-2])
    //    q[i-ky]--;    
    for (;;) {
      y2=(ky>1 ? y[ky-2] : 0)*q[i-ky];
      c=y2>>bpe;
      y2=y2 & mask;
      y1=c+q[i-ky]*y[ky-1];
      c=y1>>bpe;
      y1=y1 & mask;

      if (c==r[i] ? y1==r[i-1] ? y2>(i>1 ? r[i-2] : 0) : y1>r[i-1] : c>r[i]) 
        q[i-ky]--;
      else
        break;
    }

    linCombShift_(r,y,-q[i-ky],i-ky);    //r=r-q[i-ky]*leftShift_(y,i-ky)
    if (negative(r)) {
      addShift_(r,y,i-ky);         //r=r+leftShift_(y,i-ky)
      q[i-ky]--;
    }
  }

  rightShift_(y,a);  //undo the normalization step
  rightShift_(r,a);  //undo the normalization step
}

//do carries and borrows so each element of the bigInt x fits in bpe bits.
function carry_(x) {
  var i,k,c,b;
  k=x.length;
  c=0;
  for (i=0;i<k;i++) {
    c+=x[i];
    b=0;
    if (c<0) {
      b=-(c>>bpe);
      c+=b*radix;
    }
    x[i]=c & mask;
    c=(c>>bpe)-b;
  }
}

//return x mod n for bigInt x and integer n.
function modInt(x,n) {
  var i,c=0;
  for (i=x.length-1; i>=0; i--)
    c=(c*radix+x[i])%n;
  return c;
}

//convert the integer t into a bigInt with at least the given number of bits.
//the returned array stores the bigInt in bpe-bit chunks, little endian (buff[0] is least significant word)
//Pad the array with leading zeros so that it has at least minSize elements.
//There will always be at least one leading 0 element.
function int2bigInt(t,bits,minSize) {   
  var i,k;
  k=Math.ceil(bits/bpe)+1;
  k=minSize>k ? minSize : k;
  buff=new Array(k);
  copyInt_(buff,t);
  return buff;
}

//return the bigInt given a string representation in a given base.  
//Pad the array with leading zeros so that it has at least minSize elements.
//If base=-1, then it reads in a space-separated list of array elements in decimal.
//The array will always have at least one leading zero, unless base=-1.
function str2bigInt(s,base,minSize) {
  var d, i, j, x, y, kk;
  var k=s.length;
  if (base==-1) { //comma-separated list of array elements in decimal
    x=new Array(0);
    for (;;) {
      y=new Array(x.length+1);
      for (i=0;i<x.length;i++)
        y[i+1]=x[i];
      y[0]=parseInt(s,10);
      x=y;
      d=s.indexOf(',',0);
      if (d<1) 
        break;
      s=s.substring(d+1);
      if (s.length==0)
        break;
    }
    if (x.length<minSize) {
      y=new Array(minSize);
      copy_(y,x);
      return y;
    }
    return x;
  }

  x=int2bigInt(0,base*k,0);
  for (i=0;i<k;i++) {
    d=digitsStr.indexOf(s.substring(i,i+1),0);
    if (base<=36 && d>=36)  //convert lowercase to uppercase if base<=36
      d-=26;
    if (d>=base || d<0) {   //stop at first illegal character
      break;
    }
    multInt_(x,base);
    addInt_(x,d);
  }

  for (k=x.length;k>0 && !x[k-1];k--); //strip off leading zeros
  k=minSize>k+1 ? minSize : k+1;
  y=new Array(k);
  kk=k<x.length ? k : x.length;
  for (i=0;i<kk;i++)
    y[i]=x[i];
  for (;i<k;i++)
    y[i]=0;
  return y;
}

//is bigint x equal to integer y?
//y must have less than bpe bits
function equalsInt(x,y) {
  var i;
  if (x[0]!=y)
    return 0;
  for (i=1;i<x.length;i++)
    if (x[i])
      return 0;
  return 1;
}

//are bigints x and y equal?
//this works even if x and y are different lengths and have arbitrarily many leading zeros
function equals(x,y) {
  var i;
  var k=x.length<y.length ? x.length : y.length;
  for (i=0;i<k;i++)
    if (x[i]!=y[i])
      return 0;
  if (x.length>y.length) {
    for (;i<x.length;i++)
      if (x[i])
        return 0;
  } else {
    for (;i<y.length;i++)
      if (y[i])
        return 0;
  }
  return 1;
}

//is the bigInt x equal to zero?
function isZero(x) {
  var i;
  for (i=0;i<x.length;i++)
    if (x[i])
      return 0;
  return 1;
}

//convert a bigInt into a string in a given base, from base 2 up to base 95.
//Base -1 prints the contents of the array representing the number.
function bigInt2str(x,base) {
  var i,t,s="";

  if (s6.length!=x.length) 
    s6=dup(x);
  else
    copy_(s6,x);

  if (base==-1) { //return the list of array contents
    for (i=x.length-1;i>0;i--)
      s+=x[i]+',';
    s+=x[0];
  }
  else { //return it in the given base
    while (!isZero(s6)) {
      t=divInt_(s6,base);  //t=s6 % base; s6=floor(s6/base);
      s=digitsStr.substring(t,t+1)+s;
    }
  }
  if (s.length==0)
    s="0";
  return s;
}

//returns a duplicate of bigInt x
function dup(x) {
  var i;
  buff=new Array(x.length);
  copy_(buff,x);
  return buff;
}

//do x=y on bigInts x and y.  x must be an array at least as big as y (not counting the leading zeros in y).
function copy_(x,y) {
  var i;
  var k=x.length<y.length ? x.length : y.length;
  for (i=0;i<k;i++)
    x[i]=y[i];
  for (i=k;i<x.length;i++)
    x[i]=0;
}

//do x=y on bigInt x and integer y.  
function copyInt_(x,n) {
  var i,c;
  for (c=n,i=0;i<x.length;i++) {
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do x=x+n where x is a bigInt and n is an integer.
//x must be large enough to hold the result.
function addInt_(x,n) {
  var i,k,c,b;
  x[0]+=n;
  k=x.length;
  c=0;
  for (i=0;i<k;i++) {
    c+=x[i];
    b=0;
    if (c<0) {
      b=-(c>>bpe);
      c+=b*radix;
    }
    x[i]=c & mask;
    c=(c>>bpe)-b;
    if (!c) return; //stop carrying as soon as the carry is zero
  }
}

//right shift bigInt x by n bits.  0 <= n < bpe.
function rightShift_(x,n) {
  var i;
  var k=Math.floor(n/bpe);
  if (k) {
    for (i=0;i<x.length-k;i++) //right shift x by k elements
      x[i]=x[i+k];
    for (;i<x.length;i++)
      x[i]=0;
    n%=bpe;
  }
  for (i=0;i<x.length-1;i++) {
    x[i]=mask & ((x[i+1]<<(bpe-n)) | (x[i]>>n));
  }
  x[i]>>=n;
}

//do x=floor(|x|/2)*sgn(x) for bigInt x in 2's complement
function halve_(x) {
  var i;
  for (i=0;i<x.length-1;i++) {
    x[i]=mask & ((x[i+1]<<(bpe-1)) | (x[i]>>1));
  }
  x[i]=(x[i]>>1) | (x[i] & (radix>>1));  //most significant bit stays the same
}

//left shift bigInt x by n bits.
function leftShift_(x,n) {
  var i;
  var k=Math.floor(n/bpe);
  if (k) {
    for (i=x.length; i>=k; i--) //left shift x by k elements
      x[i]=x[i-k];
    for (;i>=0;i--)
      x[i]=0;  
    n%=bpe;
  }
  if (!n)
    return;
  for (i=x.length-1;i>0;i--) {
    x[i]=mask & ((x[i]<<n) | (x[i-1]>>(bpe-n)));
  }
  x[i]=mask & (x[i]<<n);
}

//do x=x*n where x is a bigInt and n is an integer.
//x must be large enough to hold the result.
function multInt_(x,n) {
  var i,k,c,b;
  if (!n)
    return;
  k=x.length;
  c=0;
  for (i=0;i<k;i++) {
    c+=x[i]*n;
    b=0;
    if (c<0) {
      b=-(c>>bpe);
      c+=b*radix;
    }
    x[i]=c & mask;
    c=(c>>bpe)-b;
  }
}

//do x=floor(x/n) for bigInt x and integer n, and return the remainder
function divInt_(x,n) {
  var i,r=0,s;
  for (i=x.length-1;i>=0;i--) {
    s=r*radix+x[i];
    x[i]=Math.floor(s/n);
    r=s%n;
  }
  return r;
}

//do the linear combination x=a*x+b*y for bigInts x and y, and integers a and b.
//x must be large enough to hold the answer.
function linComb_(x,y,a,b) {
  var i,c,k,kk;
  k=x.length<y.length ? x.length : y.length;
  kk=x.length;
  for (c=0,i=0;i<k;i++) {
    c+=a*x[i]+b*y[i];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;i<kk;i++) {
    c+=a*x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do the linear combination x=a*x+b*(y<<(ys*bpe)) for bigInts x and y, and integers a, b and ys.
//x must be large enough to hold the answer.
function linCombShift_(x,y,b,ys) {
  var i,c,k,kk;
  k=x.length<ys+y.length ? x.length : ys+y.length;
  kk=x.length;
  for (c=0,i=ys;i<k;i++) {
    c+=x[i]+b*y[i-ys];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;c && i<kk;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do x=x+(y<<(ys*bpe)) for bigInts x and y, and integers a,b and ys.
//x must be large enough to hold the answer.
function addShift_(x,y,ys) {
  var i,c,k,kk;
  k=x.length<ys+y.length ? x.length : ys+y.length;
  kk=x.length;
  for (c=0,i=ys;i<k;i++) {
    c+=x[i]+y[i-ys];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;c && i<kk;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do x=x-(y<<(ys*bpe)) for bigInts x and y, and integers a,b and ys.
//x must be large enough to hold the answer.
function subShift_(x,y,ys) {
  var i,c,k,kk;
  k=x.length<ys+y.length ? x.length : ys+y.length;
  kk=x.length;
  for (c=0,i=ys;i<k;i++) {
    c+=x[i]-y[i-ys];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;c && i<kk;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do x=x-y for bigInts x and y.
//x must be large enough to hold the answer.
//negative answers will be 2s complement
function sub_(x,y) {
  var i,c,k,kk;
  k=x.length<y.length ? x.length : y.length;
  for (c=0,i=0;i<k;i++) {
    c+=x[i]-y[i];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;c && i<x.length;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do x=x+y for bigInts x and y.
//x must be large enough to hold the answer.
function add_(x,y) {
  var i,c,k,kk;
  k=x.length<y.length ? x.length : y.length;
  for (c=0,i=0;i<k;i++) {
    c+=x[i]+y[i];
    x[i]=c & mask;
    c>>=bpe;
  }
  for (i=k;c && i<x.length;i++) {
    c+=x[i];
    x[i]=c & mask;
    c>>=bpe;
  }
}

//do x=x*y for bigInts x and y.  This is faster when y<x.
function mult_(x,y) {
  var i;
  if (ss.length!=2*x.length)
    ss=new Array(2*x.length);
  copyInt_(ss,0);
  for (i=0;i<y.length;i++)
    if (y[i])
      linCombShift_(ss,x,y[i],i);   //ss=1*ss+y[i]*(x<<(i*bpe))
  copy_(x,ss);
}

//do x=x mod n for bigInts x and n.
function mod_(x,n) {
  if (s4.length!=x.length)
    s4=dup(x);
  else
    copy_(s4,x);
  if (s5.length!=x.length)
    s5=dup(x);  
  divide_(s4,n,s5,x);  //x = remainder of s4 / n
}

//do x=x*y mod n for bigInts x,y,n.
//for greater speed, let y<x.
function multMod_(x,y,n) {
  var i;
  if (s0.length!=2*x.length)
    s0=new Array(2*x.length);
  copyInt_(s0,0);
  for (i=0;i<y.length;i++)
    if (y[i])
      linCombShift_(s0,x,y[i],i);   //s0=1*s0+y[i]*(x<<(i*bpe))
  mod_(s0,n);
  copy_(x,s0);
}

//do x=x*x mod n for bigInts x,n.
function squareMod_(x,n) {
  var i,j,d,c,kx,kn,k;
  for (kx=x.length; kx>0 && !x[kx-1]; kx--);  //ignore leading zeros in x
  k=kx>n.length ? 2*kx : 2*n.length; //k=# elements in the product, which is twice the elements in the larger of x and n
  if (s0.length!=k) 
    s0=new Array(k);
  copyInt_(s0,0);
  for (i=0;i<kx;i++) {
    c=s0[2*i]+x[i]*x[i];
    s0[2*i]=c & mask;
    c>>=bpe;
    for (j=i+1;j<kx;j++) {
      c=s0[i+j]+2*x[i]*x[j]+c;
      s0[i+j]=(c & mask);
      c>>=bpe;
    }
    s0[i+kx]=c;
  }
  mod_(s0,n);
  copy_(x,s0);
}

//return x with exactly k leading zero elements
function trim(x,k) {
  var i,y;
  for (i=x.length; i>0 && !x[i-1]; i--);
  y=new Array(i+k);
  copy_(y,x);
  return y;
}

//do x=x**y mod n, where x,y,n are bigInts and ** is exponentiation.  0**0=1.
//this is faster when n is odd.  x usually needs to have as many elements as n.
function powMod_(x,y,n) {
  var k1,k2,kn,np;
  if(s7.length!=n.length)
    s7=dup(n);

  //for even modulus, use a simple square-and-multiply algorithm,
  //rather than using the more complex Montgomery algorithm.
  if ((n[0]&1)==0) {
    copy_(s7,x);
    copyInt_(x,1);
    while(!equalsInt(y,0)) {
      if (y[0]&1)
        multMod_(x,s7,n);
      divInt_(y,2);
      squareMod_(s7,n); 
    }
    return;
  }

  //calculate np from n for the Montgomery multiplications
  copyInt_(s7,0);
  for (kn=n.length;kn>0 && !n[kn-1];kn--);
  np=radix-inverseModInt(modInt(n,radix),radix);
  s7[kn]=1;
  multMod_(x ,s7,n);   // x = x * 2**(kn*bp) mod n

  if (s3.length!=x.length)
    s3=dup(x);
  else
    copy_(s3,x);

  for (k1=y.length-1;k1>0 & !y[k1]; k1--);  //k1=first nonzero element of y
  if (y[k1]==0) {  //anything to the 0th power is 1
    copyInt_(x,1);
    return;
  }
  for (k2=1<<(bpe-1);k2 && !(y[k1] & k2); k2>>=1);  //k2=position of first 1 bit in y[k1]
  for (;;) {
    if (!(k2>>=1)) {  //look at next bit of y
      k1--;
      if (k1<0) {
        mont_(x,one,n,np);
        return;
      }
      k2=1<<(bpe-1);
    }    
    mont_(x,x,n,np);

    if (k2 & y[k1]) //if next bit is a 1
      mont_(x,s3,n,np);
  }
}


//do x=x*y*Ri mod n for bigInts x,y,n, 
//  where Ri = 2**(-kn*bpe) mod n, and kn is the 
//  number of elements in the n array, not 
//  counting leading zeros.  
//x array must have at least as many elemnts as the n array
//It's OK if x and y are the same variable.
//must have:
//  x,y < n
//  n is odd
//  np = -(n^(-1)) mod radix
function mont_(x,y,n,np) {
  var i,j,c,ui,t,ks;
  var kn=n.length;
  var ky=y.length;

  if (sa.length!=kn)
    sa=new Array(kn);
    
  copyInt_(sa,0);

  for (;kn>0 && n[kn-1]==0;kn--); //ignore leading zeros of n
  for (;ky>0 && y[ky-1]==0;ky--); //ignore leading zeros of y
  ks=sa.length-1; //sa will never have more than this many nonzero elements.  

  //the following loop consumes 95% of the runtime for randTruePrime_() and powMod_() for large numbers
  for (i=0; i<kn; i++) {
    t=sa[0]+x[i]*y[0];
    ui=((t & mask) * np) & mask;  //the inner "& mask" was needed on Safari (but not MSIE) at one time
    c=(t+ui*n[0]) >> bpe;
    t=x[i];
    
    //do sa=(sa+x[i]*y+ui*n)/b   where b=2**bpe.  Loop is unrolled 5-fold for speed
    j=1;
    for (;j<ky-4;) { c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++; }    
    for (;j<ky;)   { c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++; }
    for (;j<kn-4;) { c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                     c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++; }  
    for (;j<kn;)   { c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++; }   
    for (;j<ks;)   { c+=sa[j];                  sa[j-1]=c & mask;   c>>=bpe;   j++; }  
    sa[j-1]=c & mask;
  }

  if (!greater(n,sa))
    sub_(sa,n);
  copy_(x,sa);
}


