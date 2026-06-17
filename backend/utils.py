def validar_cedula_dominicana(cedula):
    # 1. Limpiar guiones y espacios
    cedula = cedula.replace("-", "").strip()
    
    # 2. Verificar que tenga exactamente 11 dígitos
    if len(cedula) != 11 or not cedula.isdigit():
        return False
        
    suma = 0
    # 3. Multiplicadores oficiales del algoritmo para la JCE
    multiplicadores = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
    
    # 4. Procesar los primeros 10 dígitos
    for i in range(10):
        digito_multiplicado = int(cedula[i]) * multiplicadores[i]
        
        # Si la multiplicación da 10 o más, se suman sus dígitos (ej. 12 -> 1 + 2 = 3)
        if digito_multiplicado >= 10:
            digito_multiplicado = (digito_multiplicado // 10) + (digito_multiplicado % 10)
            
        suma += digito_multiplicado
        
    # 5. Calcular el dígito verificador esperado
    digito_esperado = (10 - (suma % 10)) % 10
    
    # 6. Comparar el cálculo con el último dígito de la cédula
    return digito_esperado == int(cedula[10])