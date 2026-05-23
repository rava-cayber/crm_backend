import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate{
    constructor(private reflector : Reflector){}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<string[]>("roles", context.getHandler());
        if (!roles) {
            return true;
        }

        const req = context.switchToHttp().getRequest();
        const user = req['user'];

        console.log(`User role: "${user?.role}" (type: ${typeof user?.role})`);
        console.log(`Required roles:`, JSON.stringify(roles));
        
        const hasRole = user && user.role && roles.includes(user.role);
        console.log(`Has role: ${hasRole}`);

        if (!hasRole) {
            throw new ForbiddenException();
        }

        return true;
    }
}