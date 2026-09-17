export function createFighterClass(deps) {
  const {
    worldWidth, groundY, defaultSpriteHeight, gravity, roster, spriteRegistry,
    axpMax, axpGainBasic, axpGainSpecial, overdriveFrames, overdriveSpeedMultiplier,
    overdriveDamageMultiplier, animationSystem, renderer, audio, statistics,
    saveStatistics, spawnOverdriveBanner, spawnDamageNumber, onDefeated
  } = deps;

  return class Fighter {
    constructor(opts) {
      this.x = opts.x; this.y = groundY;
      this.facing = opts.facing; this.type = opts.type; this.label = opts.label; this.side = opts.side;
      const combat = roster[this.type].combat || {};
      this.hurtbox = combat.hurtbox || { width:78, height:defaultSpriteHeight };
      this.w = this.hurtbox.width; this.h = this.hurtbox.height;
      this.vx = 0; this.vy = 0; this.baseSpeed = combat.speed || 4.2; this.jumpPower = -15.5; this.onGround = true;
      this.hp = combat.hp || 100; this.maxHp = this.hp;
      this.basicDamage = combat.basicDamage || 8; this.specialDamage = combat.specialDamage || 18;
      this.axp = 0; this.overdriveTimer = 0;
      this.isAttacking = false; this.attackType = null; this.attackTimer = 0;
      this.attackCooldown = 0; this.hitApplied = false; this.hurtFlash = 0;
      this.isDead = false;
      this.spriteTick = 0; this.spriteFrame = 0; this.spriteState = 'idle';
    }

    get overdriveActive() { return this.overdriveTimer > 0; }
    get speed() { return this.baseSpeed * (this.overdriveActive ? overdriveSpeedMultiplier : 1); }

    getActiveAttackHitbox() {
      if (!this.isAttacking) return null;
      const profile = spriteRegistry[this.type]?.hitboxes[this.attackType];
      return profile ? profile[this.spriteFrame % profile.length] : null;
    }

    startAttack(type) {
      if (this.attackCooldown > 0 || this.isAttacking || this.isDead) return;
      this.isAttacking = true; this.attackType = type;
      this.attackTimer = type === 'special' ? 26 : 16; this.hitApplied = false;
    }

    activateOverdrive() {
      if (this.axp < axpMax || this.overdriveActive || this.isDead) return;
      this.axp = 0; this.overdriveTimer = overdriveFrames;
      spawnOverdriveBanner(this.type); audio.overdrive();
      statistics.overdrivesUsed++; saveStatistics();
    }

    update(opponent, dtMs = 1000 / 60) {
      if (this.isDead) return;
      if (this.overdriveTimer > 0) this.overdriveTimer--;
      animationSystem(this, dtMs);
      this.vy += gravity; this.y += this.vy;
      if (this.y >= groundY) { this.y = groundY; this.vy = 0; this.onGround = true; }
      else this.onGround = false;
      this.x += this.vx; this.x = Math.max(30, Math.min(worldWidth - 30 - this.w, this.x));
      if (!this.isAttacking) this.facing = opponent.x > this.x ? 1 : -1;
      if (this.isAttacking) {
        this.attackTimer--;
        const activeHitbox = this.getActiveAttackHitbox();
        if (!this.hitApplied && activeHitbox) this.tryHit(opponent, activeHitbox);
        if (this.attackTimer <= 0) { this.isAttacking = false; this.attackType = null; this.attackCooldown = 14; }
      }
      if (this.attackCooldown > 0) this.attackCooldown--;
      if (this.hurtFlash > 0) this.hurtFlash--;
    }

    tryHit(opponent, hitbox) {
      const centerX = this.x + this.w / 2;
      const hitLeft = this.facing > 0 ? centerX + hitbox.forward : centerX - hitbox.forward - hitbox.width;
      const hitTop = this.y + hitbox.top;
      const hurtLeft = opponent.x, hurtTop = opponent.y - opponent.h;
      const overlaps = hitLeft < hurtLeft + opponent.w && hitLeft + hitbox.width > hurtLeft &&
        hitTop < hurtTop + opponent.h && hitTop + hitbox.height > hurtTop;
      if (!overlaps) return;
      let damage = this.attackType === 'special' ? this.specialDamage : this.basicDamage;
      if (this.overdriveActive) damage = Math.round(damage * overdriveDamageMultiplier);
      opponent.receiveDamage(damage, this.facing); this.hitApplied = true;
      this.axp = Math.min(axpMax, this.axp + (this.attackType === 'special' ? axpGainSpecial : axpGainBasic));
      spawnDamageNumber(opponent.x + opponent.w/2, opponent.y - 90, damage, this.attackType);
      audio.hit(this.attackType === 'special');
    }

    receiveDamage(damage, fromFacing) {
      if (this.isDead) return;
      this.hp = Math.max(0, this.hp - damage); this.hurtFlash = 10; this.vx = fromFacing * 3;
      if (this.hp <= 0 && !this.isDead) { this.isDead = true; onDefeated(this); }
    }

    draw() { renderer(this); }
  };
}
