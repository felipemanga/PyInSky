typedef struct {
    int quot;
    int rem;
} IDIV_RETURN_T;

typedef struct {
    unsigned quot;
    unsigned rem;
} UIDIV_RETURN_T;

typedef struct {
    int (*sidiv)(int numerator, int denominator); /*!< Signed integer division */
    unsigned (*uidiv)(unsigned numerator, unsigned denominator); /*!< Unsigned integer division */
    IDIV_RETURN_T (*sidivmod)(int numerator, int denominator); /*!< Signed integer division with remainder */
    UIDIV_RETURN_T (*uidivmod)(unsigned numerator, unsigned denominator); /*!< Unsigned integer division
									    with remainder */
} ROM_DIV_API_T;

#define PTR_ROM_DRIVER_TABLE ((unsigned int *)(0x1FFF1FF8))

ROM_DIV_API_T *pROMDiv = LPC_ROM_API->divApiBase;

#define udivsi3(a, b) pROMDiv->uidiv( a, b )

#define uimod( a, b ) pROMDiv->uidivmod( a, b ).rem

